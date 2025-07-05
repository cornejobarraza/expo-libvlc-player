package expo.modules.libvlcplayer

import java.lang.ref.WeakReference

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions

import org.videolan.libvlc.MediaPlayer

object VlcPlayerManager {
    private var views: MutableList<WeakReference<VlcPlayerView>> = mutableListOf()

    lateinit var audioFocusManager: AudioFocusManager

    fun onModuleCreated(appContext: AppContext) {
        val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

        if (!this::audioFocusManager.isInitialized) {
            audioFocusManager = AudioFocusManager(appContext, views)
        }
    }

    fun registerView(view: VlcPlayerView) {
        views.find { it.get() == view } ?: run { views.add(WeakReference(view)) }
        audioFocusManager.updateAudioFocus()
    }

    fun unregisterView(view: VlcPlayerView) {
        views.removeAll { it.get() == view }
        audioFocusManager.updateAudioFocus()
    }

    fun onAppDestroyed() {
        views.forEach { view ->
            view.get()?.destroyPlayer()
        }
    }

    fun onViewDestroyed(view: VlcPlayerView) {
        view.destroyPlayer()
    }

    fun onAppForegrounded() {
        views.forEach { playerView ->
            playerView.get()?.let { view ->
                view.mediaPlayer?.let { player ->
                    player.attachViews(
                        view.videoLayout,
                        null,
                        ENABLE_SUBTITLES,
                        USE_TEXTURE_VIEW
                    )

                    if (!player.isPlaying()) {
                        val time = player.getTime()
                        val error = (-1).toLong()

                        if (time != error) {
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
                view.isBackgrounded = true
                val background = mapOf("background" to view.isBackgrounded)
                view.onBackground(background)

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
