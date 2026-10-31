package expo.modules.libvlcplayer.managers

import android.app.Activity
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
import android.net.Uri
import android.os.Build
import androidx.core.content.ContextCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.libvlcplayer.LibVlcPlayerView
import expo.modules.libvlcplayer.R
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.records.Metadata
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.videolan.libvlc.MediaPlayer
import java.io.InputStream
import java.net.URL
import java.util.UUID

private val MEDIA_ACTIONS_PLAY_PAUSE =
  PlaybackState.ACTION_PLAY or
    PlaybackState.ACTION_PAUSE or
    PlaybackState.ACTION_PLAY_PAUSE
private val ARTWORK_TIMEOUT_MS = 8_000

class MediaPlaybackManager(
  private val appContext: AppContext,
) {
  private val sessionTag = "ExpoLibVlcPlayerMediaSession_${UUID.randomUUID()}"

  private val activity: Activity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val packageName: String
    get() = context.packageName
  private val notificationManager by lazy {
    context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: run {
      throw CodedException("Failed to get NotificationManager service")
    }
  }

  private var session: MediaSession? = null
  private var sessionView: LibVlcPlayerView? = null
  private var notificationReceiver: BroadcastReceiver? = null
  private var artworkJob: Job? = null
  private var artworkURL: String? = null
  private var artwork: Bitmap? = null

  private val mediaPlayer: MediaPlayer?
    get() = sessionView?.mediaPlayer
  private val metadata: Metadata?
    get() =
      sessionView?.let { view ->
        val viewMetadata = view.metadata
        val mediaMetadata = view.getMediaMetadata()

        Metadata(
          title = viewMetadata?.title ?: mediaMetadata.title,
          artist = viewMetadata?.artist ?: mediaMetadata.artist,
          album = viewMetadata?.album ?: mediaMetadata.album,
          artworkURL = viewMetadata?.artworkURL ?: mediaMetadata.artworkURL,
        )
      }

  fun addPlaybackView(view: LibVlcPlayerView) {
    if (view.mediaPlayer != null) {
      sessionView = view
      destroyMediaSession()
      createMediaSession()
      setPlaybackState()
      updatePlaybackMetadata()
      unregisterNotificationReceiver()
      registerNotificationReceiver()
    }
  }

  fun removePlaybackView(view: LibVlcPlayerView) {
    if (sessionView == view) {
      destroyMediaSession()
      unregisterNotificationReceiver()
      sessionView = null
      findNextPlaybackView(view)?.let { nextView -> addPlaybackView(nextView) }
    }
  }

  private fun findNextPlaybackView(view: LibVlcPlayerView): LibVlcPlayerView? {
    val activity = appContext.currentActivity
    val context = appContext.reactContext

    val canFindView = activity != null && context != null

    if (!canFindView) return null

    val views =
      MediaPlayerManager.expoViews.filter { nextView ->
        nextView != view && nextView.mediaPlayer != null
      }

    return views.firstOrNull { nextView -> nextView.mediaPlayer?.isPlaying() == true }
      ?: views.firstOrNull()
  }

  fun updatePlaybackMetadata(view: LibVlcPlayerView) {
    if (sessionView == view) {
      updatePlaybackMetadata()
    }
  }

  private fun updatePlaybackMetadata() {
    val session = session ?: return
    val metadata = metadata ?: return
    val player = mediaPlayer ?: return

    val length = player.getLength()

    updateArtwork(metadata.artworkURL)

    val builder =
      MediaMetadata
        .Builder()
        .putString(MediaMetadata.METADATA_KEY_TITLE, metadata.title)
        .putString(MediaMetadata.METADATA_KEY_ARTIST, metadata.artist)
        .putString(MediaMetadata.METADATA_KEY_ALBUM, metadata.album)
        .apply {
          if (length > 0) putLong(MediaMetadata.METADATA_KEY_DURATION, length)
          artwork?.let { bitmap -> putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, bitmap) }
        }

    session.setMetadata(builder.build())

    showMediaNotification()
  }

  fun updatePlaybackState(view: LibVlcPlayerView) {
    if (sessionView == view) {
      setPlaybackState()
      showMediaNotification()
    }
  }

  fun updatePlaybackState(
    view: LibVlcPlayerView,
    time: Long,
  ) {
    if (sessionView == view) {
      setPlaybackState(time)
    }
  }

  private fun createMediaSession() {
    session = MediaSession(context, sessionTag)
    session!!.isActive = true
    activity.mediaController = session!!.controller

    session!!.setCallback(
      object : MediaSession.Callback() {
        override fun onSeekTo(time: Long) {
          mediaPlayer?.setTime(time)

          setPlaybackState(time)
        }

        override fun onPlay() {
          mediaPlayer?.play()
        }

        override fun onPause() {
          mediaPlayer?.pause()
        }
      },
    )

    val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)

    session!!.setSessionActivity(
      launchIntent?.let { intent ->
        PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
      },
    )
  }

  private fun destroyMediaSession() {
    notificationManager?.cancel(MediaPlayerConstants.MEDIA_NOTIFICATION_ID)
    session?.release()
    session = null
    artworkJob?.cancel()
    artworkJob = null
    artworkURL = null
    artwork = null
  }

  private fun updateArtwork(url: String?) {
    if (url != artworkURL) {
      artworkJob?.cancel()
      artworkURL = url
      artwork = null

      if (url != null) {
        artworkJob =
          CoroutineScope(Dispatchers.Main).launch {
            artwork =
              withContext(Dispatchers.IO) {
                try {
                  openArtworkStream(url).use { input -> BitmapFactory.decodeStream(input) }
                } catch (_: Exception) {
                  null
                }
              }

            updatePlaybackMetadata()
          }
      }
    }
  }

  private fun openArtworkStream(url: String): InputStream? {
    val uri = Uri.parse(url)

    return when (uri.scheme) {
      "http", "https" -> {
        URL(url)
          .openConnection()
          .apply {
            connectTimeout = ARTWORK_TIMEOUT_MS
            readTimeout = ARTWORK_TIMEOUT_MS
          }.getInputStream()
      }

      null -> {
        val identifier = context.resources.getIdentifier(url, "drawable", packageName)

        if (identifier != 0) context.resources.openRawResource(identifier) else null
      }

      else -> {
        context.contentResolver.openInputStream(uri)
      }
    }
  }

  private fun setPlaybackState(time: Long? = null) {
    val session = session ?: return
    val player = mediaPlayer ?: return

    val actions =
      if (player.isSeekable()) {
        MEDIA_ACTIONS_PLAY_PAUSE or PlaybackState.ACTION_SEEK_TO
      } else {
        MEDIA_ACTIONS_PLAY_PAUSE
      }
    val state =
      if (player.isPlaying()) {
        PlaybackState.STATE_PLAYING
      } else {
        PlaybackState.STATE_PAUSED
      }
    val position = time ?: player.getTime()
    val rate = player.getRate()

    val builder =
      PlaybackState
        .Builder()
        .setActions(actions)
        .setState(
          state,
          position,
          rate,
        )

    session.setPlaybackState(builder.build())
  }

  private fun registerNotificationReceiver() {
    notificationReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(
          context: Context?,
          intent: Intent?,
        ) {
          mediaPlayer?.let { player ->
            when (intent?.action) {
              MediaPlayerConstants.MEDIA_NOTIFICATION_PLAY -> {
                player.play()
              }

              MediaPlayerConstants.MEDIA_NOTIFICATION_PAUSE -> {
                player.pause()
              }
            }
          }
        }
      }

    ContextCompat.registerReceiver(
      context,
      notificationReceiver!!,
      IntentFilter().apply {
        addAction(MediaPlayerConstants.MEDIA_NOTIFICATION_PLAY)
        addAction(MediaPlayerConstants.MEDIA_NOTIFICATION_PAUSE)
      },
      ContextCompat.RECEIVER_NOT_EXPORTED,
    )
  }

  private fun unregisterNotificationReceiver() {
    try {
      if (notificationReceiver != null) {
        context.unregisterReceiver(notificationReceiver)
        notificationReceiver = null
      }
    } catch (_: Exception) {
      // Receiver not registered
    }
  }

  private fun showMediaNotification() {
    val notification = buildMediaNotification()

    if (notification != null) {
      notificationManager?.notify(MediaPlayerConstants.MEDIA_NOTIFICATION_ID, notification)
    }
  }

  private fun buildMediaNotification(): Notification? {
    val session = session ?: return null
    val metadata = metadata ?: return null
    val player = mediaPlayer ?: return null

    val controller = session.controller
    val isPlaying = player.isPlaying()

    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        notificationManager?.createNotificationChannel(
          NotificationChannel(
            MediaPlayerConstants.MEDIA_CHANNEL_ID,
            "Media playback",
            NotificationManager.IMPORTANCE_LOW,
          ).apply {
            setShowBadge(false)
          },
        )

        Notification.Builder(context, MediaPlayerConstants.MEDIA_CHANNEL_ID)
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(context)
      }

    return builder
      .setContentIntent(controller.sessionActivity)
      .setContentTitle(metadata.title)
      .setContentText(metadata.artist)
      .setLargeIcon(artwork)
      .setOnlyAlertOnce(true)
      .setOngoing(isPlaying)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setSmallIcon(R.drawable.play_circle)
      .setStyle(
        Notification
          .MediaStyle()
          .setMediaSession(session.sessionToken)
          .setShowActionsInCompactView(0),
      ).apply {
        val control =
          if (isPlaying) {
            MediaPlayerConstants.MEDIA_NOTIFICATION_PAUSE
          } else {
            MediaPlayerConstants.MEDIA_NOTIFICATION_PLAY
          }
        val intent = Intent(control).setPackage(packageName)
        val res = if (isPlaying) R.drawable.pause_24px else R.drawable.play_arrow_24px

        val icon = Icon.createWithResource(context, res)
        val title = if (isPlaying) "Pause" else "Play"
        val pending = PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)

        addAction(
          Notification.Action
            .Builder(
              icon,
              title,
              pending,
            ).build(),
        )
      }.build()
  }
}
