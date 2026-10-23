package expo.modules.libvlcplayer.managers

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.libvlcplayer.LibVlcPlayerView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.URL
import org.videolan.libvlc.MediaPlayer as VLCMediaPlayer

private const val CHANNEL_ID = "expo-libvlc-player"
private const val NOTIFICATION_ID = 0x564C43 // "VLC"
private const val ARTWORK_SIZE = 512

class NowPlayingManager(
  private val appContext: AppContext,
) {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private var session: MediaSession? = null
  private var activeView: LibVlcPlayerView? = null
  private var artworkUrl: String? = null
  private var artwork: Bitmap? = null
  private var lastStateUpdate = 0L

  fun update(view: LibVlcPlayerView) {
    val metadata = view.nowPlaying
    val player = view.mediaPlayer

    if (metadata == null || player == null) {
      clear(view)
      return
    }

    activeView = view
    val session = session ?: createSession().also { session = it }

    val builder =
      MediaMetadata
        .Builder()
        .putString(MediaMetadata.METADATA_KEY_TITLE, metadata.title)
        .putString(MediaMetadata.METADATA_KEY_ARTIST, metadata.artist)
        .putString(MediaMetadata.METADATA_KEY_ALBUM, metadata.album)
        .putLong(MediaMetadata.METADATA_KEY_DURATION, player.length)

    // Fetched once per URL: a change starts a new fetch, an in-flight or failed one isn't retried
    if (artworkUrl != metadata.artworkURL) {
      loadArtwork(metadata.artworkURL)
    }

    artwork?.let { builder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, it) }

    session.setMetadata(builder.build())
    setPlaybackState(session, player)
    session.isActive = true

    notify(session, metadata.title, metadata.artist, player.isPlaying)
  }

  /** Called on every time change: keeps the position honest after buffering. Throttled to 1 s. */
  fun refresh(view: LibVlcPlayerView) {
    val session = session ?: return
    val player = view.mediaPlayer ?: return
    if (activeView !== view || System.currentTimeMillis() - lastStateUpdate < 1000) return
    setPlaybackState(session, player)
  }

  private fun setPlaybackState(
    session: MediaSession,
    player: VLCMediaPlayer,
  ) {
    val state = if (player.isPlaying) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED

    session.setPlaybackState(
      PlaybackState
        .Builder()
        .setActions(
          PlaybackState.ACTION_PLAY or
            PlaybackState.ACTION_PAUSE or
            PlaybackState.ACTION_PLAY_PAUSE or
            PlaybackState.ACTION_SEEK_TO or
            PlaybackState.ACTION_STOP,
        ).setState(state, player.time, player.rate)
        .build(),
    )
    lastStateUpdate = System.currentTimeMillis()
  }

  fun clear(view: LibVlcPlayerView) {
    if (activeView !== view) return

    activeView = null
    artwork = null
    artworkUrl = null
    session?.isActive = false
    session?.release()
    session = null
    notificationManager.cancel(NOTIFICATION_ID)
  }

  private val notificationManager: NotificationManager
    get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private fun createSession(): MediaSession =
    MediaSession(context, CHANNEL_ID).apply {
      setCallback(
        object : MediaSession.Callback() {
          override fun onPlay() {
            activeView?.play()
          }

          override fun onPause() {
            activeView?.pause()
          }

          override fun onStop() {
            activeView?.stop()
          }

          override fun onSeekTo(pos: Long) {
            activeView?.seek(pos.toDouble())
          }
        },
      )
      launchIntent()?.let { setSessionActivity(it) }
    }

  private fun launchIntent(): PendingIntent? {
    val intent =
      context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
  }

  private fun notify(
    session: MediaSession,
    title: String?,
    artist: String?,
    playing: Boolean,
  ) {
    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        notificationManager.createNotificationChannel(
          NotificationChannel(CHANNEL_ID, "Playback", NotificationManager.IMPORTANCE_LOW),
        )
        Notification.Builder(context, CHANNEL_ID)
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(context)
      }

    val notification =
      builder
        .setSmallIcon(context.applicationInfo.icon)
        .setContentTitle(title)
        .setContentText(artist)
        .setLargeIcon(artwork)
        .setContentIntent(launchIntent())
        .setOngoing(playing)
        .setOnlyAlertOnce(true)
        .setVisibility(Notification.VISIBILITY_PUBLIC)
        .setStyle(Notification.MediaStyle().setMediaSession(session.sessionToken))
        .build()

    notificationManager.notify(NOTIFICATION_ID, notification)
  }

  private fun loadArtwork(url: String?) {
    artwork = null
    artworkUrl = url

    if (url == null) return

    CoroutineScope(Dispatchers.IO).launch {
      val bitmap =
        try {
          decodeArtwork(URL(url).readBytes())
        } catch (_: Exception) {
          null
        } ?: return@launch

      withContext(Dispatchers.Main) {
        if (artworkUrl != url) return@withContext

        artwork = bitmap
        activeView?.let { update(it) }
      }
    }
  }

  // Downsampled while decoding: a full-size poster would stay in memory for the whole playback
  private fun decodeArtwork(bytes: ByteArray): Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)

    var sampleSize = 1
    while (maxOf(bounds.outWidth, bounds.outHeight) / (sampleSize * 2) >= ARTWORK_SIZE) {
      sampleSize *= 2
    }

    val options = BitmapFactory.Options().apply { inSampleSize = sampleSize }
    return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
  }
}
