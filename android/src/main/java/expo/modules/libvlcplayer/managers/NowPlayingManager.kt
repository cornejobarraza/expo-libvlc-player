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
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import kotlinx.coroutines.launch
import java.net.URL
import org.videolan.libvlc.MediaPlayer as VLCMediaPlayer

class NowPlayingManager(
  private val appContext: AppContext,
) {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val notificationManager by lazy {
    context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
  }

  private var session: MediaSession? = null
  private var activeView: LibVlcPlayerView? = null
  private var artworkUrl: String? = null
  private var artwork: Bitmap? = null
  private var lastStateUpdate: Long = 0L
  private var lastPosition: Long = 0L

  // Notification actions before Android 13
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

    // Seeks and prop changes don't bring back a stopped session
    if (metadata == null || player == null || view.isStopped) {
      clear(view)
      return
    }

    // Only a playing view takes over the controls
    if (activeView != null && activeView !== view && !player.isPlaying) return

    activeView = view
    val session = session ?: createSession().also { newSession -> session = newSession }

    val builder =
      MediaMetadata
        .Builder()
        .putString(MediaMetadata.METADATA_KEY_TITLE, metadata.title)
        .putString(MediaMetadata.METADATA_KEY_ARTIST, metadata.artist)
        .putString(MediaMetadata.METADATA_KEY_ALBUM, metadata.album)
        .putLong(MediaMetadata.METADATA_KEY_DURATION, player.length)

    // Fetched once per URL, failed fetches aren't retried
    if (artworkUrl != metadata.artworkURL) {
      loadArtwork(metadata.artworkURL)
    }

    artwork?.let { bitmap -> builder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, bitmap) }

    session.setMetadata(builder.build())
    setPlaybackState(session, player, elapsed)
    session.isActive = true

    notify(session, metadata.title, metadata.artist, player.isPlaying, player.length > 0)
  }

  fun refresh(view: LibVlcPlayerView) {
    val session = session ?: return
    val player = view.mediaPlayer ?: return
    val sinceLastUpdate = System.currentTimeMillis() - lastStateUpdate

    if (activeView !== view || sinceLastUpdate < MediaPlayerConstants.NOW_PLAYING_REFRESH_MS) return
    setPlaybackState(session, player)
  }

  private fun setPlaybackState(
    session: MediaSession,
    player: VLCMediaPlayer,
    elapsed: Long? = null,
  ) {
    val state = if (player.isPlaying) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED
    // Seek target from the caller, the player time lags behind an async seek
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
        .addCustomAction(
          MediaPlayerConstants.ACTION_NOW_PLAYING_REWIND,
          "Rewind",
          android.R.drawable.ic_media_rew,
        ).addCustomAction(
          MediaPlayerConstants.ACTION_NOW_PLAYING_FORWARD,
          "Forward",
          android.R.drawable.ic_media_ff,
        )
    }

    session.setPlaybackState(builder.build())
    lastPosition = position
    lastStateUpdate = System.currentTimeMillis()
  }

  private fun handleAction(action: String?) {
    val view = activeView ?: return
    when (action) {
      MediaPlayerConstants.ACTION_NOW_PLAYING_PLAY_PAUSE -> {
        if (view.mediaPlayer?.isPlaying == true) {
          view.pause()
        } else {
          view.play()
        }
      }

      MediaPlayerConstants.ACTION_NOW_PLAYING_REWIND -> {
        skip(view, -MediaPlayerConstants.SEEK_STEP_MS)
      }

      MediaPlayerConstants.ACTION_NOW_PLAYING_FORWARD -> {
        skip(view, MediaPlayerConstants.SEEK_STEP_MS)
      }
    }
  }

  // Skips from the shown position, the player time lags behind an async seek
  private fun skip(
    view: LibVlcPlayerView,
    delta: Long,
  ) {
    val player = view.mediaPlayer ?: return
    val elapsed = if (player.isPlaying) System.currentTimeMillis() - lastStateUpdate else 0
    val target = maxOf(0, lastPosition + (elapsed * player.rate).toLong() + delta)
    val clampedTarget = if (player.length > 0) minOf(target, player.length) else target

    view.seek(clampedTarget.toDouble())
  }

  fun clear(view: LibVlcPlayerView) {
    if (activeView !== view) return

    activeView = null
    artwork = null
    artworkUrl = null
    session?.let { mediaSession ->
      mediaSession.isActive = false
      mediaSession.release()
      unregisterActionReceiver()
    }
    session = null
    NowPlayingService.stop()
    notificationManager.cancel(MediaPlayerConstants.NOW_PLAYING_NOTIFICATION_ID)
  }

  private fun createSession(): MediaSession =
    MediaSession(context, MediaPlayerConstants.NOW_PLAYING_CHANNEL_ID).apply {
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
      launchIntent()?.let { intent -> setSessionActivity(intent) }
      registerActionReceiver()
    }

  private fun registerActionReceiver() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) return

    // Below API 33 the flag alone doesn't keep the receiver private
    ContextCompat.registerReceiver(
      context,
      actionReceiver,
      IntentFilter().apply {
        addAction(MediaPlayerConstants.ACTION_NOW_PLAYING_PLAY_PAUSE)
        addAction(MediaPlayerConstants.ACTION_NOW_PLAYING_REWIND)
        addAction(MediaPlayerConstants.ACTION_NOW_PLAYING_FORWARD)
      },
      ContextCompat.RECEIVER_NOT_EXPORTED,
    )
  }

  private fun unregisterActionReceiver() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) return

    try {
      appContext.reactContext?.unregisterReceiver(actionReceiver)
    } catch (_: Exception) {
      // Receiver not registered
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
        action(
          MediaPlayerConstants.ACTION_NOW_PLAYING_PLAY_PAUSE,
          android.R.drawable.ic_media_pause,
          "Pause",
        )
      } else {
        action(
          MediaPlayerConstants.ACTION_NOW_PLAYING_PLAY_PAUSE,
          android.R.drawable.ic_media_play,
          "Play",
        )
      }
    val actions =
      if (canSkip) {
        listOf(
          action(
            MediaPlayerConstants.ACTION_NOW_PLAYING_REWIND,
            android.R.drawable.ic_media_rew,
            "Rewind",
          ),
          playPause,
          action(
            MediaPlayerConstants.ACTION_NOW_PLAYING_FORWARD,
            android.R.drawable.ic_media_ff,
            "Forward",
          ),
        )
      } else {
        listOf(playPause)
      }

    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        notificationManager.createNotificationChannel(
          NotificationChannel(
            MediaPlayerConstants.NOW_PLAYING_CHANNEL_ID,
            "Playback",
            NotificationManager.IMPORTANCE_LOW,
          ),
        )
        Notification.Builder(context, MediaPlayerConstants.NOW_PLAYING_CHANNEL_ID)
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
            .setShowActionsInCompactView(*IntArray(actions.size) { index -> index }),
        ).apply { actions.forEach { action -> addAction(action) } }
        .build()

    notificationManager.notify(MediaPlayerConstants.NOW_PLAYING_NOTIFICATION_ID, notification)
    NowPlayingService.update(context, notification, playing)
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

    appContext.backgroundCoroutineScope.launch {
      val bitmap =
        try {
          decodeArtwork(URL(url).readBytes())
        } catch (_: Exception) {
          null
        } ?: return@launch

      appContext.mainQueue.launch {
        if (artworkUrl != url) return@launch

        artwork = bitmap
        activeView?.let { view -> update(view) }
      }
    }
  }

  // Downsampled so a full-size poster doesn't stay in memory during playback
  private fun decodeArtwork(bytes: ByteArray): Bitmap? {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)

    var sampleSize = 1
    val maxSize = maxOf(bounds.outWidth, bounds.outHeight)

    while (maxSize / (sampleSize * 2) >= MediaPlayerConstants.NOW_PLAYING_ARTWORK_SIZE) {
      sampleSize *= 2
    }

    val options = BitmapFactory.Options().apply { inSampleSize = sampleSize }
    return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
  }
}
