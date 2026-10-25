package expo.modules.libvlcplayer.managers

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.drawable.Icon
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.Bundle
import androidx.core.content.ContextCompat
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
private const val ACTION_PLAY_PAUSE = "now_playing_play_pause"
private const val ACTION_SKIP_BACKWARD = "now_playing_skip_backward"
private const val ACTION_SKIP_FORWARD = "now_playing_skip_forward"
private const val SKIP_INTERVAL_MS = 10_000L

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
  private var lastPosition = 0L

  // Before Android 13 the notification only shows its own actions
  private val actionReceiver =
    object : BroadcastReceiver() {
      override fun onReceive(
        context: Context?,
        intent: Intent?,
      ) {
        handleAction(intent?.action)
      }
    }

  fun update(
    view: LibVlcPlayerView,
    elapsed: Long? = null,
  ) {
    val metadata = view.nowPlaying
    val player = view.mediaPlayer

    // A seek or prop change must not bring back a stopped session
    if (metadata == null || player == null || view.isStopped) {
      clear(view)
      return
    }

    // Only a playing view takes the controls from another one
    if (activeView != null && activeView !== view && !player.isPlaying) return

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
    setPlaybackState(session, player, elapsed)
    session.isActive = true

    notify(session, metadata.title, metadata.artist, player.isPlaying, player.length > 0)
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
    elapsed: Long? = null,
  ) {
    val state = if (player.isPlaying) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED
    // A seek is asynchronous: the caller passes the target time so the control doesn't jump back
    val position = elapsed ?: player.time
    val canSeek = player.length > 0
    val actions =
      PlaybackState.ACTION_PLAY or
        PlaybackState.ACTION_PAUSE or
        PlaybackState.ACTION_PLAY_PAUSE or
        PlaybackState.ACTION_STOP

    val builder =
      PlaybackState
        .Builder()
        .setActions(if (canSeek) actions or PlaybackState.ACTION_SEEK_TO else actions)
        .setState(state, position, player.rate)

    if (canSeek) {
      builder
        .addCustomAction(ACTION_SKIP_BACKWARD, "Rewind", android.R.drawable.ic_media_rew)
        .addCustomAction(ACTION_SKIP_FORWARD, "Forward", android.R.drawable.ic_media_ff)
    }

    session.setPlaybackState(builder.build())
    lastPosition = position
    lastStateUpdate = System.currentTimeMillis()
  }

  private fun handleAction(action: String?) {
    val view = activeView ?: return
    when (action) {
      ACTION_PLAY_PAUSE -> if (view.mediaPlayer?.isPlaying == true) view.pause() else view.play()
      ACTION_SKIP_BACKWARD -> skip(view, -SKIP_INTERVAL_MS)
      ACTION_SKIP_FORWARD -> skip(view, SKIP_INTERVAL_MS)
    }
  }

  // Seeks are asynchronous: quick skips start from the shown position, not the stale player time
  private fun skip(
    view: LibVlcPlayerView,
    delta: Long,
  ) {
    val player = view.mediaPlayer ?: return
    val elapsed = if (player.isPlaying) System.currentTimeMillis() - lastStateUpdate else 0
    val target = maxOf(0, lastPosition + (elapsed * player.rate).toLong() + delta)
    view.seek((if (player.length > 0) minOf(target, player.length) else target).toDouble())
  }

  fun clear(view: LibVlcPlayerView) {
    if (activeView !== view) return

    activeView = null
    artwork = null
    artworkUrl = null
    session?.let {
      it.isActive = false
      it.release()
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
        context.unregisterReceiver(actionReceiver)
      }
    }
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

          override fun onCustomAction(
            action: String,
            extras: Bundle?,
          ) {
            handleAction(action)
          }
        },
      )
      launchIntent()?.let { setSessionActivity(it) }

      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
        // Below API 33 the flag alone doesn't keep the receiver private
        ContextCompat.registerReceiver(
          context,
          actionReceiver,
          IntentFilter().apply {
            addAction(ACTION_PLAY_PAUSE)
            addAction(ACTION_SKIP_BACKWARD)
            addAction(ACTION_SKIP_FORWARD)
          },
          ContextCompat.RECEIVER_NOT_EXPORTED,
        )
      }
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
    canSkip: Boolean,
  ) {
    val playPause =
      if (playing) {
        action(ACTION_PLAY_PAUSE, android.R.drawable.ic_media_pause, "Pause")
      } else {
        action(ACTION_PLAY_PAUSE, android.R.drawable.ic_media_play, "Play")
      }
    val actions =
      if (canSkip) {
        listOf(
          action(ACTION_SKIP_BACKWARD, android.R.drawable.ic_media_rew, "Rewind"),
          playPause,
          action(ACTION_SKIP_FORWARD, android.R.drawable.ic_media_ff, "Forward"),
        )
      } else {
        listOf(playPause)
      }

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
        .setStyle(
          Notification
            .MediaStyle()
            .setMediaSession(session.sessionToken)
            .setShowActionsInCompactView(*IntArray(actions.size) { it }),
        ).apply { actions.forEach { addAction(it) } }
        .build()

    notificationManager.notify(NOTIFICATION_ID, notification)
  }

  private fun action(
    name: String,
    icon: Int,
    title: String,
  ): Notification.Action {
    val intent = Intent(name).setPackage(context.packageName)
    val pending = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
    return Notification.Action
      .Builder(
        Icon.createWithResource(context, icon),
        title,
        pending,
      ).build()
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
