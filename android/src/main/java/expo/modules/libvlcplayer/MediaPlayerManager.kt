package expo.modules.libvlcplayer

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import java.lang.ref.WeakReference

object MediaPlayerManager {
    private var playerViews: MutableList<WeakReference<LibVlcPlayerView>> = mutableListOf()

    lateinit var audioFocusManager: AudioFocusManager

    fun onModuleCreated(appContext: AppContext) {
        val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

        if (!this::audioFocusManager.isInitialized) {
            audioFocusManager = AudioFocusManager(appContext, playerViews)
        }
    }

    fun registerPlayerView(view: LibVlcPlayerView) {
        playerViews.find { it.get() == view } ?: run { playerViews.add(WeakReference(view)) }
        audioFocusManager.updateAudioFocus()
    }

    fun unregisterPlayerView(view: LibVlcPlayerView) {
        playerViews.removeAll { it.get() == view }
        audioFocusManager.updateAudioFocus()
        view.destroyPlayer()
    }

    fun onAppForeground() {
        playerViews.forEach { playerView ->
            playerView.get()?.let { view ->
                val background = mapOf("background" to false)
                view.onBackground(background)

                view.attachPlayer()

                view.mediaPlayer?.let { player ->
                    if (!player.isPlaying()) {
                        val time = player.getTime()
                        val rewind = 5000L
                        val newTime =
                            if (time >= rewind) {
                                time - rewind
                            } else {
                                time
                            }

                        player.setTime(newTime)
                    }
                }
            }
        }
    }

    fun onAppBackground() {
        playerViews.forEach { playerView ->
            playerView.get()?.let { view ->
                val background = mapOf("background" to true)
                view.onBackground(background)

                view.mediaPlayer?.let { player ->
                    val shouldPause = !view.playInBackground && player.isPlaying()

                    if (shouldPause) {
                        player.pause()
                    }
                }

                view.detachPlayer()
            }
        }
    }
}
