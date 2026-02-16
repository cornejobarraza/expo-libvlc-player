package expo.modules.libvlcplayer

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import java.lang.ref.WeakReference

object MediaPlayerManager {
    lateinit var audioFocusManager: AudioFocusManager

    var playerViews: MutableList<WeakReference<LibVlcPlayerView>> = mutableListOf()

    fun registerPlayerView(view: LibVlcPlayerView) {
        playerViews.find { it.get() == view } ?: run { playerViews.add(WeakReference(view)) }
    }

    fun unregisterPlayerView(view: LibVlcPlayerView) {
        playerViews.removeAll { it.get() == view }
    }

    fun onModuleCreate(appContext: AppContext) {
        val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

        if (!this::audioFocusManager.isInitialized) {
            audioFocusManager = AudioFocusManager(appContext)
        }
    }

    fun onModuleDestroy() {
        playerViews.forEach { playerView ->
            playerView.get()?.destroyPlayer()
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
