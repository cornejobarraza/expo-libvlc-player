package expo.modules.libvlcplayer

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.libvlcplayer.enums.AudioMixingMode
import expo.modules.libvlcplayer.records.Slave
import expo.modules.libvlcplayer.records.Tracks

private const val BUFFERING_EVENT = "onBuffering"
private const val PLAYING_EVENT = "onPlaying"
private const val PAUSED_EVENT = "onPaused"
private const val STOPPED_EVENT = "onStopped"
private const val END_REACHED_EVENT = "onEndReached"
private const val ENCOUNTERED_ERROR_EVENT = "onEncounteredError"
private const val POSITION_CHANGED_EVENT = "onPositionChanged"
private const val PARSED_CHANGED_EVENT = "onParsedChanged"
private const val BACKGROUND_EVENT = "onBackground"

val playerEvents =
    arrayOf(
        BUFFERING_EVENT,
        PLAYING_EVENT,
        PAUSED_EVENT,
        STOPPED_EVENT,
        END_REACHED_EVENT,
        ENCOUNTERED_ERROR_EVENT,
        POSITION_CHANGED_EVENT,
        PARSED_CHANGED_EVENT,
        BACKGROUND_EVENT,
    )

class LibVlcPlayerModule : Module() {
    override fun definition() =
        ModuleDefinition {
            Name("ExpoLibVlcPlayer")

            OnCreate {
                MediaPlayerManager.onModuleCreated(appContext)
            }

            OnDestroy {
                MediaPlayerManager.onModuleDestroyed()
            }

            View(LibVlcPlayerView::class) {
                Events(playerEvents)

                Prop("source") { view: LibVlcPlayerView, source: String? ->
                    view.source = source
                }

                Prop("options") { view: LibVlcPlayerView, options: ArrayList<String>? ->
                    view.options = options ?: ArrayList<String>()
                }

                Prop("slaves") { view: LibVlcPlayerView, slaves: ArrayList<Slave>? ->
                    view.slaves = slaves
                }

                Prop("tracks") { view: LibVlcPlayerView, tracks: Tracks? ->
                    view.tracks = tracks
                }

                Prop("volume") { view: LibVlcPlayerView, volume: Int? ->
                    view.volume = volume ?: MAX_PLAYER_VOLUME
                }

                Prop("mute") { view: LibVlcPlayerView, mute: Boolean? ->
                    view.mute = mute ?: false
                }

                Prop("rate") { view: LibVlcPlayerView, rate: Float? ->
                    view.rate = rate ?: DEFAULT_PLAYER_RATE
                }

                Prop("time") { view: LibVlcPlayerView, time: Int? ->
                    view.time = time ?: DEFAULT_PLAYER_TIME
                }

                Prop("repeat") { view: LibVlcPlayerView, repeat: Boolean? ->
                    view.repeat = repeat ?: false
                }

                Prop("scale") { view: LibVlcPlayerView, scale: Float? ->
                    view.scale = scale ?: DEFAULT_PLAYER_SCALE
                }

                Prop("aspectRatio") { view: LibVlcPlayerView, aspectRatio: String? ->
                    view.aspectRatio = aspectRatio
                }

                Prop("audioMixingMode") { view: LibVlcPlayerView, audioMixingMode: AudioMixingMode? ->
                    view.audioMixingMode = audioMixingMode ?: AudioMixingMode.AUTO
                }

                Prop("playInBackground") { view: LibVlcPlayerView, playInBackground: Boolean? ->
                    view.playInBackground = playInBackground ?: false
                }

                Prop("autoplay") { view: LibVlcPlayerView, autoplay: Boolean? ->
                    view.autoplay = autoplay ?: true
                }

                OnViewDestroys { view: LibVlcPlayerView ->
                    MediaPlayerManager.unregisterPlayerView(view)
                }

                OnViewDidUpdateProps { view: LibVlcPlayerView ->
                    view.createPlayer()
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

            OnActivityEntersBackground {
                MediaPlayerManager.onAppBackground()
            }
        }
}
