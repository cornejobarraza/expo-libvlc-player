package expo.modules.libvlcplayer.managers

import expo.modules.kotlin.AppContext
import expo.modules.libvlcplayer.LibVlcPlayerView
import java.util.Collections
import java.util.WeakHashMap

object MediaPlayerManager {
    lateinit var audioFocusManager: AudioFocusManager
    lateinit var keepAwakeManager: KeepAwakeManager

    val playerViews: MutableSet<LibVlcPlayerView> = Collections.newSetFromMap(WeakHashMap())

    fun registerPlayerView(view: LibVlcPlayerView) {
        playerViews.add(view)
    }

    fun unregisterPlayerView(view: LibVlcPlayerView) {
        playerViews.remove(view)
    }

    fun onModuleCreate(appContext: AppContext) {
        if (!this::audioFocusManager.isInitialized) {
            audioFocusManager = AudioFocusManager(appContext)
        }

        if (!this::keepAwakeManager.isInitialized) {
            keepAwakeManager = KeepAwakeManager(appContext)
        }
    }

    fun onModuleDestroy() {
        playerViews.forEach { view ->
            view.destroyPlayer()
        }
    }

    fun onModuleForeground() {
        playerViews.forEach { view ->
            view.onForeground(Unit)
        }
    }

    fun onModuleBackground() {
        playerViews.forEach { view ->
            view.onBackground(Unit)

            view.mediaPlayer?.let { player ->
                if (player.isPlaying()) {
                    player.pause()
                }
            }
        }
    }
}
