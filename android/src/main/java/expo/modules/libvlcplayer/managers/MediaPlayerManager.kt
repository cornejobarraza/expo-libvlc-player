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
        if (!this::audioFocusManager.isInitialized) {
            audioFocusManager = AudioFocusManager(appContext)
        }

        if (!this::keepAwakeManager.isInitialized) {
            keepAwakeManager = KeepAwakeManager(appContext)
        }

        if (!this::pictureInPictureManager.isInitialized) {
            pictureInPictureManager = PictureInPictureManager(appContext)
        }
    }

    fun onModuleDestroy() {
        expoViews.forEach { view ->
            view.destroyPlayer()
        }
    }

    fun onModuleForeground() {
        expoViews.forEach { view ->
            view.isInBackground = false
            view.onForeground(Unit)
            view.cancelPauseJob()
        }
    }

    fun onModuleBackground() {
        expoViews.forEach { view ->
            view.isInBackground = true
            view.onBackground(Unit)
            view.pauseJob()
        }
    }
}
