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
private const val TIME_CHANGED_EVENT = "onTimeChanged"
private const val POSITION_CHANGED_EVENT = "onPositionChanged"
private const val ES_ADDED_EVENT = "onESAdded"
private const val DIALOG_DISPLAY_EVENT = "onDialogDisplay"
private const val FIRST_PLAY_EVENT = "onFirstPlay"
private const val BACKGROUND_EVENT = "onBackground"

val playerEvents =
    arrayOf(
        BUFFERING_EVENT,
        PLAYING_EVENT,
        PAUSED_EVENT,
        STOPPED_EVENT,
        END_REACHED_EVENT,
        ENCOUNTERED_ERROR_EVENT,
        TIME_CHANGED_EVENT,
        POSITION_CHANGED_EVENT,
        ES_ADDED_EVENT,
        DIALOG_DISPLAY_EVENT,
        FIRST_PLAY_EVENT,
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

                Prop("tracks") { view: LibVlcPlayerView, tracks: Tracks? ->
                    view.tracks = tracks
                }

                Prop("slaves") { view: LibVlcPlayerView, slaves: ArrayList<Slave>? ->
                    view.slaves = slaves ?: ArrayList<Slave>()
                }

                Prop("scale") { view: LibVlcPlayerView, scale: Float? ->
                    view.scale = scale ?: DEFAULT_PLAYER_SCALE
                }

                Prop("aspectRatio") { view: LibVlcPlayerView, aspectRatio: String? ->
                    view.aspectRatio = aspectRatio
                }

                Prop("rate") { view: LibVlcPlayerView, rate: Float? ->
                    view.rate = rate ?: DEFAULT_PLAYER_RATE
                }

                Prop("time") { view: LibVlcPlayerView, time: Int? ->
                    view.time = time ?: DEFAULT_PLAYER_TIME
                }

                Prop("volume") { view: LibVlcPlayerView, volume: Int? ->
                    view.volume = volume ?: MAX_PLAYER_VOLUME
                }

                Prop("mute") { view: LibVlcPlayerView, mute: Boolean? ->
                    view.mute = mute ?: false
                }

                Prop("audioMixingMode") { view: LibVlcPlayerView, audioMixingMode: AudioMixingMode? ->
                    view.audioMixingMode = audioMixingMode ?: AudioMixingMode.AUTO
                }

                Prop("repeat") { view: LibVlcPlayerView, repeat: Boolean? ->
                    view.repeat = repeat ?: false
                }

                Prop("playInBackground") { view: LibVlcPlayerView, playInBackground: Boolean? ->
                    view.playInBackground = playInBackground ?: false
                }

                Prop("autoplay") { view: LibVlcPlayerView, autoplay: Boolean? ->
                    view.autoplay = autoplay ?: true
                }

                OnViewDestroys { view: LibVlcPlayerView ->
                    MediaPlayerManager.unregisterPlayerView(view)
                    view.destroyPlayer()
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

                AsyncFunction("seek") { view: LibVlcPlayerView, value: Double, type: String? ->
                    view.seek(value, type ?: "position")
                }

                AsyncFunction("postAction") { view: LibVlcPlayerView, action: Int ->
                    view.postAction(action)
                }

                AsyncFunction("dismiss") { view: LibVlcPlayerView ->
                    view.dismiss()
                }
            }

            OnActivityEntersBackground {
                MediaPlayerManager.onAppBackground()
            }
        }
}
