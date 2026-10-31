package expo.modules.libvlcplayer.services

import android.app.Service
import android.content.Intent
import android.os.IBinder

class MediaPlaybackService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null
}
