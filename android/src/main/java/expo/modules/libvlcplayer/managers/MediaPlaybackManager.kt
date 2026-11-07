package expo.modules.libvlcplayer.managers

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.content.ContextCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.libvlcplayer.LibVlcPlayerView
import expo.modules.libvlcplayer.R
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.records.Metadata
import expo.modules.libvlcplayer.services.MediaPlaybackService
import expo.modules.libvlcplayer.services.PlaybackServiceBinder
import expo.modules.libvlcplayer.utils.MediaAction
import expo.modules.libvlcplayer.utils.MediaActionReceiver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.interfaces.IMedia
import java.io.InputStream
import java.net.URL
import java.util.UUID

private data class SessionMetadata(
  val metadata: Metadata,
  val artwork: Bitmap?,
  val length: Long,
)

private data class NotificationState(
  val title: String?,
  val artist: String?,
  val artwork: Bitmap?,
  val isPlaying: Boolean,
  val isSeekable: Boolean,
)

class MediaPlaybackManager(
  private val appContext: AppContext,
) {
  private val sessionTag = "ExpoLibVlcPlayerMediaSession_${UUID.randomUUID()}"
  private val handler = Handler(Looper.getMainLooper())
  private val handOffRunnable = Runnable { handOff() }
  private val exitForegroundRunnable = Runnable { exitForeground() }

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val notificationManager by lazy {
    val manager =
      context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: run {
        throw CodedException("Failed to get NotificationManager service")
      }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(
          MediaPlayerConstants.MEDIA_CHANNEL_ID,
          MediaPlayerConstants.MEDIA_CHANNEL_NAME,
          NotificationManager.IMPORTANCE_LOW,
        ).apply {
          setShowBadge(false)
        },
      )
    }

    manager
  }
  private val notificationActions: Map<MediaAction, Notification.Action> by lazy {
    MediaAction.entries.associateWith { action ->
      Notification.Action
        .Builder(
          action.createIcon(context),
          action.title,
          action.createPendingIntent(
            context,
            MediaPlayerConstants.MEDIA_NOTIFICATION_ACTION_PREFIX,
          ),
        ).build()
    }
  }
  private val dismissIntent: PendingIntent by lazy {
    val intent =
      Intent(MediaPlayerConstants.MEDIA_NOTIFICATION_DISMISS_ACTION).setPackage(context.packageName)

    PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
  }

  private var session: MediaSession? = null
  private var sessionView: LibVlcPlayerView? = null
  private var sessionMetadata: SessionMetadata? = null
  private var metadata: Metadata? = null
  private var notification: Notification? = null
  private var notificationState: NotificationState? = null
  private var notificationReceiver: MediaActionReceiver? = null
  private var dismissReceiver: BroadcastReceiver? = null
  private var artworkJob: Job? = null
  private var artworkURL: String? = null
  private var artwork: Bitmap? = null

  private var playbackService: MediaPlaybackService? = null
  private var isServiceBound: Boolean = false

  private val serviceConnection =
    object : ServiceConnection {
      override fun onServiceConnected(
        name: ComponentName?,
        binder: IBinder?,
      ) {
        playbackService = (binder as? PlaybackServiceBinder)?.service
        updateForegroundState()
      }

      override fun onServiceDisconnected(name: ComponentName?) {
        playbackService = null
      }
    }

  private val mediaPlayer: MediaPlayer?
    get() = sessionView?.mediaPlayer

  val isBackgroundPlaybackSupported: Boolean by lazy {
    val component = ComponentName(context, MediaPlaybackService::class.java)

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.packageManager.getServiceInfo(component, PackageManager.ComponentInfoFlags.of(0))
      } else {
        @Suppress("DEPRECATION")
        context.packageManager.getServiceInfo(component, 0)
      }
      true
    } catch (_: PackageManager.NameNotFoundException) {
      false
    }
  }

  fun isPlaybackView(view: LibVlcPlayerView): Boolean = sessionView == view

  fun onStateChanged(view: LibVlcPlayerView) {
    if (sessionView != view && canClaimSession(view)) {
      setSessionView(view)
    } else if (sessionView == view && view.mediaPlayer?.isPlaying() != true) {
      findPlayingView(view)?.let { nextView -> setSessionView(nextView) }
    }

    if (sessionView == view) {
      setPlaybackState()
      updateNotification()
      updateForegroundState()
    }
  }

  fun updatePlaybackSource(view: LibVlcPlayerView) {
    if (sessionView == view) {
      setPlaybackState()
      updatePlaybackMetadata()
    }
  }

  fun updatePlaybackView(view: LibVlcPlayerView) {
    if (sessionView == view && !isEligible(view)) {
      removePlaybackView(view)
    } else {
      onStateChanged(view)
    }
  }

  fun updatePlaybackMetadata(view: LibVlcPlayerView) {
    if (sessionView == view) {
      updatePlaybackMetadata()
    }
  }

  fun updatePlaybackPosition(
    view: LibVlcPlayerView,
    time: Long? = null,
    rate: Float? = null,
  ) {
    if (sessionView == view) {
      setPlaybackState(time, rate)
    }
  }

  fun removePlaybackView(view: LibVlcPlayerView) {
    if (sessionView == view) {
      sessionView = null

      handler.removeCallbacks(handOffRunnable)
      handler.post(handOffRunnable)
    }
  }

  private fun release() {
    handler.removeCallbacks(handOffRunnable)
    handler.removeCallbacks(exitForegroundRunnable)

    sessionView = null
    sessionMetadata = null
    metadata = null
    notification = null
    notificationState = null
    resetArtwork()

    session?.let { session ->
      val context = appContext.reactContext

      unbindPlaybackService(context)

      context?.let { context ->
        notificationReceiver?.unregister(context)
        dismissReceiver?.let { receiver -> unregisterReceiver(context, receiver) }
      }

      notificationReceiver = null
      dismissReceiver = null
      session.release()
      this.session = null

      if (context != null) {
        notificationManager.cancel(MediaPlayerConstants.MEDIA_NOTIFICATION_ID)
      }
    }
  }

  private fun isEligible(view: LibVlcPlayerView): Boolean =
    view.canPlayInBackground && view.mediaPlayer != null

  private fun canClaimSession(view: LibVlcPlayerView): Boolean =
    isEligible(view) && view.mediaPlayer?.isPlaying() == true && mediaPlayer?.isPlaying() != true

  private fun handOff() {
    if (sessionView == null) {
      findNextPlaybackView()?.let { view -> setSessionView(view) } ?: release()
    }
  }

  private fun findPlayingView(excludedView: LibVlcPlayerView): LibVlcPlayerView? =
    findNextView { view ->
      view != excludedView && isEligible(view) && view.mediaPlayer?.isPlaying() == true
    }

  private fun findNextPlaybackView(): LibVlcPlayerView? =
    findNextView { view ->
      val player = view.mediaPlayer

      isEligible(view) &&
        (player?.isPlaying() == true || player?.getPlayerState() == IMedia.State.Paused)
    }

  private fun findNextView(predicate: (LibVlcPlayerView) -> Boolean): LibVlcPlayerView? {
    val views =
      MediaPlayerManager.expoViews.filter { view ->
        view.mediaPlayer != null &&
          predicate(view)
      }

    return views.firstOrNull { view -> view.mediaPlayer?.isPlaying() == true }
      ?: views.firstOrNull()
  }

  private fun setSessionView(view: LibVlcPlayerView) {
    handler.removeCallbacks(handOffRunnable)

    sessionView = view

    val session = session ?: createMediaSession()

    session.isActive = true
    bindPlaybackService()
    setPlaybackState()
    updatePlaybackMetadata()
    updateForegroundState()
  }

  private fun createMediaSession(): MediaSession {
    val session = MediaSession(context, sessionTag)

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      @Suppress("DEPRECATION")
      session.setFlags(
        MediaSession.FLAG_HANDLES_MEDIA_BUTTONS or MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS,
      )
    }

    session.setCallback(
      object : MediaSession.Callback() {
        override fun onPlay() {
          sessionView?.handleMediaAction(MediaAction.PLAY)
        }

        override fun onPause() {
          sessionView?.handleMediaAction(MediaAction.PAUSE)
        }

        override fun onSeekTo(time: Long) {
          sessionView?.seek(time.toDouble())
        }

        override fun onRewind() {
          sessionView?.handleMediaAction(MediaAction.REWIND)
        }

        override fun onFastForward() {
          sessionView?.handleMediaAction(MediaAction.FORWARD)
        }

        override fun onCustomAction(
          action: String,
          extras: Bundle?,
        ) {
          MediaAction
            .fromIntentAction(
              MediaPlayerConstants.MEDIA_NOTIFICATION_ACTION_PREFIX,
              action,
            )?.let { mediaAction ->
              sessionView?.handleMediaAction(mediaAction)
            }
        }
      },
    )

    context.packageManager.getLaunchIntentForPackage(context.packageName)?.let { intent ->
      session.setSessionActivity(
        PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE),
      )
    }

    notificationReceiver =
      MediaActionReceiver(MediaPlayerConstants.MEDIA_NOTIFICATION_ACTION_PREFIX) { action ->
        sessionView?.handleMediaAction(action)
      }.also { receiver -> receiver.register(context) }

    dismissReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(
          context: Context?,
          intent: Intent?,
        ) {
          onNotificationDismissed()
        }
      }.also { receiver ->
        ContextCompat.registerReceiver(
          context,
          receiver,
          IntentFilter(MediaPlayerConstants.MEDIA_NOTIFICATION_DISMISS_ACTION),
          ContextCompat.RECEIVER_NOT_EXPORTED,
        )
      }

    this.session = session

    return session
  }

  private fun unregisterReceiver(
    context: Context,
    receiver: BroadcastReceiver,
  ) {
    try {
      context.unregisterReceiver(receiver)
    } catch (_: IllegalArgumentException) {
      // Receiver not registered
    }
  }

  private fun onNotificationDismissed() {
    if (mediaPlayer?.isPlaying() == true) {
      notificationState = null
      updateNotification()
    } else {
      release()
    }
  }

  private fun bindPlaybackService() {
    if (!isServiceBound) {
      val intent = Intent(context, MediaPlaybackService::class.java)

      isServiceBound = context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
    }
  }

  private fun unbindPlaybackService(context: Context?) {
    playbackService?.exitForeground(removeNotification = true)
    playbackService = null

    if (isServiceBound) {
      context?.let { context ->
        context.stopService(Intent(context, MediaPlaybackService::class.java))
        context.unbindService(serviceConnection)
      }

      isServiceBound = false
    }
  }

  private fun updatePlaybackMetadata() {
    val session = session ?: return
    val view = sessionView ?: return
    val player = view.mediaPlayer ?: return

    val viewMetadata = view.metadata
    val mediaMetadata = view.getMediaMetadata()
    val metadata =
      Metadata(
        title = viewMetadata?.title ?: mediaMetadata.title,
        artist = viewMetadata?.artist ?: mediaMetadata.artist,
        album = viewMetadata?.album ?: mediaMetadata.album,
        artworkURL =
          viewMetadata?.artworkURL
            ?: mediaMetadata.artworkURL?.takeIf { url ->
              Uri.parse(url).scheme?.lowercase() in MediaPlayerConstants.MEDIA_ARTWORK_SCHEMES
            },
      )

    this.metadata = metadata

    updateArtwork(metadata.artworkURL)

    val nextMetadata = SessionMetadata(metadata, artwork, player.getLength())

    if (nextMetadata != sessionMetadata) {
      sessionMetadata = nextMetadata

      val builder =
        MediaMetadata
          .Builder()
          .putString(MediaMetadata.METADATA_KEY_TITLE, metadata.title)
          .putString(MediaMetadata.METADATA_KEY_ARTIST, metadata.artist)
          .putString(MediaMetadata.METADATA_KEY_ALBUM, metadata.album)
          .apply {
            if (nextMetadata.length > 0) {
              putLong(MediaMetadata.METADATA_KEY_DURATION, nextMetadata.length)
            }

            artwork?.let { bitmap -> putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, bitmap) }
          }

      session.setMetadata(builder.build())
    }

    updateNotification()
  }

  private fun resetArtwork(url: String? = null) {
    artworkJob?.cancel()
    artworkJob = null
    artworkURL = url
    artwork = null
  }

  private fun updateArtwork(url: String?) {
    if (url != artworkURL) {
      resetArtwork(url)

      if (url != null) {
        artworkJob =
          appContext.mainQueue.launch {
            artwork = withContext(Dispatchers.IO) { loadArtwork(url) }
            updatePlaybackMetadata()
          }
      }
    }
  }

  private fun loadArtwork(url: String): Bitmap? =
    try {
      openArtworkStream(url)?.use { input -> decodeArtwork(input.readBytes()) }
    } catch (_: Exception) {
      null
    } catch (_: OutOfMemoryError) {
      null
    }

  private fun decodeArtwork(bytes: ByteArray): Bitmap? =
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)

  private fun openArtworkStream(url: String): InputStream? {
    val uri = Uri.parse(url)

    return when (uri.scheme) {
      "http", "https" -> {
        URL(url)
          .openConnection()
          .apply {
            connectTimeout = MediaPlayerConstants.ARTWORK_TIMEOUT_MS
            readTimeout = MediaPlayerConstants.ARTWORK_TIMEOUT_MS
          }.getInputStream()
      }

      null -> {
        val identifier = context.resources.getIdentifier(url, "drawable", context.packageName)

        if (identifier != 0) context.resources.openRawResource(identifier) else null
      }

      else -> {
        context.contentResolver.openInputStream(uri)
      }
    }
  }

  private fun MediaPlayer.isStopped(): Boolean =
    getPlayerState().let { state -> state == IMedia.State.Stopped || state == IMedia.State.Ended }

  private fun setPlaybackState(
    time: Long? = null,
    rate: Float? = null,
  ) {
    val session = session ?: return
    val player = mediaPlayer ?: return

    val isStopped = player.isStopped()
    val isSeekable = player.isSeekable()
    val actions =
      if (isSeekable) {
        MediaPlayerConstants.MEDIA_ACTIONS_PLAY_PAUSE or MediaPlayerConstants.MEDIA_ACTIONS_SEEK
      } else {
        MediaPlayerConstants.MEDIA_ACTIONS_PLAY_PAUSE
      }
    val state =
      when (player.getPlayerState()) {
        IMedia.State.Playing -> PlaybackState.STATE_PLAYING
        IMedia.State.Paused -> PlaybackState.STATE_PAUSED
        IMedia.State.Opening -> PlaybackState.STATE_BUFFERING
        IMedia.State.Stopped, IMedia.State.Ended -> PlaybackState.STATE_STOPPED
        IMedia.State.Error -> PlaybackState.STATE_ERROR
        else -> PlaybackState.STATE_NONE
      }
    val position = if (!isStopped) (time ?: player.getTime()).coerceAtLeast(0L) else 0L
    val speed = rate ?: player.getRate()

    val builder =
      PlaybackState
        .Builder()
        .setActions(actions)
        .setState(state, position, speed)
        .apply {
          if (isSeekable) {
            listOf(MediaAction.REWIND, MediaAction.FORWARD).forEach { action ->
              addCustomAction(
                action.intentAction(MediaPlayerConstants.MEDIA_NOTIFICATION_ACTION_PREFIX),
                action.title,
                action.iconRes,
              )
            }
          }
        }

    session.setPlaybackState(builder.build())
  }

  private fun updateNotification() {
    val player = mediaPlayer ?: return
    val metadata = metadata ?: return

    val state =
      NotificationState(
        title = metadata.title,
        artist = metadata.artist,
        artwork = artwork,
        isPlaying = player.isPlaying(),
        isSeekable = player.isSeekable(),
      )

    if (state != notificationState) {
      val notification = buildMediaNotification(state) ?: return

      notificationState = state
      this.notification = notification

      notificationManager.notify(MediaPlayerConstants.MEDIA_NOTIFICATION_ID, notification)
    }
  }

  private fun updateForegroundState() {
    val service = playbackService ?: return
    val notification = notification ?: return

    handler.removeCallbacks(exitForegroundRunnable)

    if (mediaPlayer?.isPlaying() == true) {
      service.enterForeground(notification)
    } else {
      handler.postDelayed(exitForegroundRunnable, MediaPlayerConstants.FOREGROUND_TIMEOUT_MS)
    }
  }

  private fun exitForeground() {
    if (mediaPlayer?.isPlaying() != true) {
      playbackService?.exitForeground(removeNotification = false)
    }
  }

  private fun buildMediaNotification(state: NotificationState): Notification? {
    val session = session ?: return null

    val actions = MediaAction.controls(state.isPlaying, state.isSeekable)

    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Notification.Builder(context, MediaPlayerConstants.MEDIA_CHANNEL_ID)
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(context)
      }

    return builder
      .setContentIntent(session.controller.sessionActivity)
      .setDeleteIntent(dismissIntent)
      .setContentTitle(state.title)
      .setContentText(state.artist)
      .setLargeIcon(state.artwork)
      .setOnlyAlertOnce(true)
      .setOngoing(state.isPlaying)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setSmallIcon(R.drawable.play_circle)
      .setStyle(
        Notification
          .MediaStyle()
          .setMediaSession(session.sessionToken)
          .setShowActionsInCompactView(*IntArray(actions.size) { index -> index }),
      ).apply {
        actions.forEach { action -> addAction(notificationActions.getValue(action)) }
      }.build()
  }
}
