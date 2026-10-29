package expo.modules.libvlcplayer.managers

import expo.modules.kotlin.AppContext
import expo.modules.libvlcplayer.LibVlcPlayerView
import java.util.Collections
import java.util.WeakHashMap

object MediaPlayerManager {
  lateinit var audioFocusManager: AudioFocusManager
  lateinit var keepAwakeManager: KeepAwakeManager
  lateinit var pictureInPictureManager: PictureInPictureManager

  val expoViews: MutableSet<LibVlcPlayerView> = Collections.newSetFromMap(WeakHashMap())

  fun registerExpoView(view: LibVlcPlayerView) {
    expoViews.add(view)
  }

  fun unregisterExpoView(view: LibVlcPlayerView) {
    expoViews.remove(view)
  }

  fun onModuleCreate(appContext: AppContext) {
    audioFocusManager = AudioFocusManager(appContext)
    keepAwakeManager = KeepAwakeManager(appContext)
    pictureInPictureManager = PictureInPictureManager(appContext)
  }

  fun onModuleDestroy() {
    expoViews.forEach { view ->
      view.destroyPlayer()
    }
  }

  fun onModuleForeground() {
    expoViews.forEach { view ->
      view.onForeground(Unit)

      if (view.pictureInPicture) {
        view.cancelPauseDelay()
      }
    }
  }

  fun onModuleBackground() {
    expoViews.forEach { view ->
      view.onBackground(Unit)

      if (view.pictureInPicture) {
        view.pauseDelay()
      } else {
        view.pause()
      }
    }
  }
}
