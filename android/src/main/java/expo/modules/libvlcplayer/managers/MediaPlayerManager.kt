package expo.modules.libvlcplayer.managers

import expo.modules.kotlin.AppContext
import expo.modules.libvlcplayer.LibVlcPlayerView
import java.lang.ref.WeakReference

object MediaPlayerManager {
    lateinit var audioFocusManager: AudioFocusManager
    lateinit var keepAwakeManager: KeepAwakeManager

    val playerViews: MutableList<WeakReference<LibVlcPlayerView>> = mutableListOf()

    fun registerPlayerView(view: LibVlcPlayerView) {
        playerViews.find { it.get() == view } ?: run { playerViews.add(WeakReference(view)) }
    }

    fun unregisterPlayerView(view: LibVlcPlayerView) {
        playerViews.removeAll { it.get() == view }
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
        playerViews.forEach { playerView ->
            playerView.get()?.let { view ->
                view.destroyPlayer()
            }
        }
    }

    fun onModuleForeground() {
        playerViews.forEach { playerView ->
            playerView.get()?.let { view ->
                view.onForeground(Unit)
            }
        }
    }

    fun onModuleBackground() {
        playerViews.forEach { playerView ->
            playerView.get()?.let { view ->
                view.onBackground(Unit)

                view.mediaPlayer?.let { player ->
                    val shouldPause = !view.playInBackground && player.isPlaying()

                    if (shouldPause) {
                        player.pause()
                    }
                }
            }
        }
    }
}
