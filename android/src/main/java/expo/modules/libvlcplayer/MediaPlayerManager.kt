package expo.modules.libvlcplayer

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import java.lang.ref.WeakReference

object MediaPlayerManager {
    internal var playerViews: MutableList<WeakReference<LibVlcPlayerView>> = mutableListOf()

    lateinit var audioFocusManager: AudioFocusManager

    fun onModuleCreated(appContext: AppContext) {
        val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

        if (!this::audioFocusManager.isInitialized) {
            audioFocusManager = AudioFocusManager(appContext)
        }
    }

    fun onModuleDestroyed() {
        playerViews.forEach { playerView ->
            playerView.get()?.destroyPlayer()
        }
    }

    fun registerPlayerView(view: LibVlcPlayerView) {
        playerViews.find { it.get() == view } ?: run { playerViews.add(WeakReference(view)) }
    }

    fun unregisterPlayerView(view: LibVlcPlayerView) {
        playerViews.removeAll { it.get() == view }
    }

    fun onPlayerForeground() {
        playerViews.forEach { playerView ->
            playerView.get()?.let { view ->
                view.onForeground(Unit)
            }
        }
    }

    fun onPlayerBackground() {
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
