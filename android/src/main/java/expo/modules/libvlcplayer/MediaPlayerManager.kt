package expo.modules.libvlcplayer

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import java.lang.ref.WeakReference

object MediaPlayerManager {
    private var views: MutableList<WeakReference<LibVlcPlayerView>> = mutableListOf()

    lateinit var audioFocusManager: AudioFocusManager

    fun onModuleCreated(appContext: AppContext) {
        val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

        if (!this::audioFocusManager.isInitialized) {
            audioFocusManager = AudioFocusManager(appContext, views)
        }
    }

    fun registerView(view: LibVlcPlayerView) {
        views.find { it.get() == view } ?: run { views.add(WeakReference(view)) }
        audioFocusManager.updateAudioFocus()
    }

    fun unregisterView(view: LibVlcPlayerView) {
        view.destroyPlayer()
        views.removeAll { it.get() == view }
        audioFocusManager.updateAudioFocus()
    }

    fun onAppForegrounded() {
        views.forEach { playerView ->
            playerView.get()?.let { view ->
                view.mediaPlayer?.let { player ->
                    player.attachViews(
                        view.playerView,
                        null,
                        ENABLE_SUBTITLES,
                        USE_TEXTURE_VIEW,
                    )

                    if (!player.isPlaying()) {
                        val time = player.getTime()

                        if (time != -1L) {
                            player.setTime(time)
                        }
                    }
                }
            }
        }
    }

    fun onAppBackgrounded() {
        views.forEach { playerView ->
            playerView.get()?.let { view ->
                view.onBackground(mapOf())

                view.mediaPlayer?.let { player ->
                    if (view.playInBackground != true && player.isPlaying()) {
                        player.pause()
                    }

                    player.detachViews()
                }
            }
        }
    }
}
