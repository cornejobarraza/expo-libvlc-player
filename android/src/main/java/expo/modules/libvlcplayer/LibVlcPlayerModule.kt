package expo.modules.libvlcplayer

import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.libvlcplayer.enums.AudioMixingMode

private const val BUFFERING_EVENT = "onBuffering"
private const val PLAYING_EVENT = "onPlaying"
private const val PAUSED_EVENT = "onPaused"
private const val STOPPED_EVENT = "onStopped"
private const val ENDED_EVENT = "onEnded"
private const val REPEAT_EVENT = "onRepeat"
private const val ERROR_EVENT = "onError"
private const val POSITION_CHANGED_EVENT = "onPositionChanged"
private const val LOAD_EVENT = "onLoad"
private const val BACKGROUND_EVENT = "onBackground"

val playerEvents =
    arrayOf(
        BUFFERING_EVENT,
        PLAYING_EVENT,
        PAUSED_EVENT,
        STOPPED_EVENT,
        ENDED_EVENT,
        REPEAT_EVENT,
        ERROR_EVENT,
        POSITION_CHANGED_EVENT,
        LOAD_EVENT,
        BACKGROUND_EVENT,
    )

class LibVlcPlayerModule : Module() {
    override fun definition() =
        ModuleDefinition {
            Name("ExpoLibVlcPlayer")

            OnCreate {
                MediaPlayerManager.onModuleCreated(appContext)
            }

            View(LibVlcPlayerView::class) {
                Events(playerEvents)

                Prop("uri") { view: LibVlcPlayerView, uri: String ->
                    view.uri = uri
                }

                Prop("subtitle") { view: LibVlcPlayerView, subtitle: ReadableMap? ->
                    view.setSubtitle(subtitle)
                }

                Prop("options") { view: LibVlcPlayerView, options: ArrayList<String>? ->
                    view.options = options ?: ArrayList<String>()
                }

                Prop("volume") { view: LibVlcPlayerView, volume: Int? ->
                    view.setVolume(volume ?: MAX_PLAYER_VOLUME)
                }

                Prop("mute") { view: LibVlcPlayerView, mute: Boolean? ->
                    view.setMute(mute ?: false)
                }

                Prop("rate") { view: LibVlcPlayerView, rate: Float? ->
                    view.setRate(rate ?: DEFAULT_PLAYER_RATE)
                }

                Prop("tracks") { view: LibVlcPlayerView, tracks: ReadableMap? ->
                    view.setTracks(tracks)
                }

                Prop("time") { view: LibVlcPlayerView, time: Int? ->
                    view.time = time ?: DEFAULT_PLAYER_START
                }

                Prop("repeat") { view: LibVlcPlayerView, repeat: Boolean? ->
                    view.setRepeat(repeat ?: false)
                }

                Prop("aspectRatio") { view: LibVlcPlayerView, aspectRatio: String? ->
                    view.setAspectRatio(aspectRatio)
                }

                Prop("audioMixingMode") { view: LibVlcPlayerView, audioMixingMode: AudioMixingMode? ->
                    view.audioMixingMode = audioMixingMode ?: AudioMixingMode.AUTO
                }

                Prop("playInBackground") { view: LibVlcPlayerView, playInBackground: Boolean? ->
                    view.playInBackground = playInBackground ?: false
                }

                Prop("autoplay") { view: LibVlcPlayerView, autoplay: Boolean? ->
                    view.setAutoplay(autoplay ?: true)
                }

                AsyncFunction("play") { view: LibVlcPlayerView ->
                    view.play()
                }

                AsyncFunction("pause") { view: LibVlcPlayerView ->
                    view.pause()
                }

                AsyncFunction("stop") { view: LibVlcPlayerView ->
                    view.stop()
                }

                AsyncFunction("seek") { view: LibVlcPlayerView, position: Float ->
                    view.seek(position)
                }
            }

            OnActivityEntersForeground {
                MediaPlayerManager.onAppForegrounded()
            }

            OnActivityEntersBackground {
                MediaPlayerManager.onAppBackgrounded()
            }
        }
}
