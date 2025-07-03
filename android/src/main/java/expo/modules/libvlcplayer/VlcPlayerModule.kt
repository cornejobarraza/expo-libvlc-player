package expo.modules.libvlcplayer

import expo.modules.libvlcplayer.enums.AudioMixingMode

import com.facebook.react.bridge.ReadableMap

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val BUFFERING_EVENT = "onBuffering"
private const val PLAYING_EVENT = "onPlaying"
private const val PAUSED_EVENT = "onPaused"
private const val STOPPED_EVENT = "onStopped"
private const val ENDED_EVENT = "onEnded"
private const val REPEAT_EVENT = "onRepeat"
private const val WARN_EVENT = "onWarn"
private const val ERROR_EVENT = "onError"
private const val POSITION_CHANGED_EVENT = "onPositionChanged"
private const val LOAD_EVENT = "onLoad"
private const val BACKGROUND_EVENT = "onBackground"

val playerEvents = arrayOf(
    BUFFERING_EVENT,
    PLAYING_EVENT,
    PAUSED_EVENT,
    STOPPED_EVENT,
    ENDED_EVENT,
    REPEAT_EVENT,
    WARN_EVENT,
    ERROR_EVENT,
    POSITION_CHANGED_EVENT,
    LOAD_EVENT,
    BACKGROUND_EVENT
)

class VlcPlayerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoLibVlcPlayer")

        OnCreate {
            VlcPlayerManager.onModuleCreated(appContext)
        }

        OnDestroy {
            VlcPlayerManager.onAppDestroyed()
        }

        View(VlcPlayerView::class) {
            Events(playerEvents)

            Prop("uri") { view: VlcPlayerView, uri: String ->
                view.uri = uri
            }

            Prop("subtitle") { view: VlcPlayerView, subtitle: ReadableMap? ->
                view.setSubtitle(subtitle)
            }

            Prop("options") { view: VlcPlayerView, options: ArrayList<String>? ->
                view.options = options ?: ArrayList<String>()
            }

            Prop("volume") { view: VlcPlayerView, volume: Int? ->
                view.setVolume(volume ?: MAX_PLAYER_VOLUME)
            }

            Prop("mute") { view: VlcPlayerView, mute: Boolean? ->
                view.setMute(mute ?: false)
            }

            Prop("rate") { view: VlcPlayerView, rate: Float? ->
                view.setRate(rate ?: DEFAULT_PLAYER_RATE)
            }

            Prop("tracks") { view: VlcPlayerView, tracks: ReadableMap? ->
                view.setTracks(tracks)
            }

            Prop("repeat") { view: VlcPlayerView, repeat: Boolean? ->
                view.setRepeat(repeat ?: false)
            }

            Prop("aspectRatio") { view: VlcPlayerView, aspectRatio: String? ->
                view.setAspectRatio(aspectRatio)
            }

            Prop("audioMixingMode") { view: VlcPlayerView, audioMixingMode: AudioMixingMode ->
                view.audioMixingMode = audioMixingMode
            }

            Prop("playInBackground") { view: VlcPlayerView, playInBackground: Boolean? ->
                view.playInBackground = playInBackground ?: false
            }

            Prop("autoplay") { view: VlcPlayerView, autoplay: Boolean? ->
                view.setAutoplay(autoplay ?: true)
            }

            OnViewDidUpdateProps { view: VlcPlayerView ->
                view.createPlayer()
            }

            OnViewDestroys { view: VlcPlayerView ->
                VlcPlayerManager.onViewDestroyed(view)
                VlcPlayerManager.unregisterView(view)
            }

            AsyncFunction("play") { view: VlcPlayerView ->
                view.play()
            }

            AsyncFunction("pause") { view: VlcPlayerView ->
                view.pause()
            }

            AsyncFunction("stop") { view: VlcPlayerView ->
                view.stop()
            }

            AsyncFunction("seek") { view: VlcPlayerView, position: Float ->
                view.seek(position)
            }
        }

        OnActivityEntersForeground {
            VlcPlayerManager.onAppForegrounded()
        }

        OnActivityEntersBackground {
            VlcPlayerManager.onAppBackgrounded()
        }
    }
}
