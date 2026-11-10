package expo.modules.libvlcplayer.utils

import android.app.Notification
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.IBinder
import androidx.core.app.ServiceCompat
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.managers.MediaPlayerManager

class PlaybackServiceBinder(
  val service: MediaPlaybackService,
) : Binder()

class MediaPlaybackService : Service() {
  override fun onBind(intent: Intent?): IBinder = PlaybackServiceBinder(this)

  override fun onStartCommand(
    intent: Intent?,
    flags: Int,
    startId: Int,
  ): Int = START_NOT_STICKY

  override fun onTaskRemoved(rootIntent: Intent?) {
    super.onTaskRemoved(rootIntent)
    MediaPlayerManager.onModuleDestroy()
    stopSelf()
  }

  fun enterForeground(notification: Notification) {
    try {
      startService(Intent(this, MediaPlaybackService::class.java))
    } catch (_: IllegalStateException) {
      // Background start not allowed, the bound service can still enter the foreground
    }

    try {
      ServiceCompat.startForeground(
        this,
        MediaPlayerConstants.MEDIA_NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
      )
    } catch (_: Exception) {
      // Android 12+ disallows most foreground service starts from background
    }
  }

  fun exitForeground(removeNotification: Boolean) {
    val flags =
      if (removeNotification) {
        ServiceCompat.STOP_FOREGROUND_REMOVE
      } else {
        ServiceCompat.STOP_FOREGROUND_DETACH
      }

    ServiceCompat.stopForeground(this, flags)
  }
}
