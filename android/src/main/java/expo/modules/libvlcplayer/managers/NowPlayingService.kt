package expo.modules.libvlcplayer.managers

import android.app.Notification
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import expo.modules.libvlcplayer.constants.MediaPlayerConstants

// Android freezes or kills a cached app, this keeps it alive while nowPlaying media plays
class NowPlayingService : Service() {
  private var lastStartId: Int = 0

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    instance = this
  }

  override fun onDestroy() {
    instance = null
    super.onDestroy()
  }

  override fun onStartCommand(
    intent: Intent?,
    flags: Int,
    startId: Int,
  ): Int {
    lastStartId = startId

    val notification = notification ?: return START_NOT_STICKY

    val serviceType =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
      } else {
        0
      }

    ServiceCompat.startForeground(
      this,
      MediaPlayerConstants.NOW_PLAYING_NOTIFICATION_ID,
      notification,
      serviceType,
    )

    // Paused or cleared while starting, startForeground() is still required
    if (!foreground) {
      demote(cleared)
    }

    return START_NOT_STICKY
  }

  // Detached on pause so the notification stays
  private fun demote(remove: Boolean) {
    val flags =
      if (remove) {
        ServiceCompat.STOP_FOREGROUND_REMOVE
      } else {
        ServiceCompat.STOP_FOREGROUND_DETACH
      }

    ServiceCompat.stopForeground(this, flags)
    stopSelf(lastStartId)
  }

  companion object {
    private var instance: NowPlayingService? = null
    private var notification: Notification? = null
    private var foreground: Boolean = false
    private var cleared: Boolean = false

    fun update(
      context: Context,
      notification: Notification,
      playing: Boolean,
    ) {
      this.notification = notification
      cleared = false

      if (playing == foreground) return
      foreground = playing

      if (!playing) {
        instance?.demote(false)
        return
      }

      try {
        ContextCompat.startForegroundService(
          context,
          Intent(context, NowPlayingService::class.java),
        )
      } catch (_: Exception) {
        // Background start not allowed on Android 12+
        foreground = false
      }
    }

    fun stop() {
      cleared = true
      foreground = false
      instance?.demote(true)
    }
  }
}
