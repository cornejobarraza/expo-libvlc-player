package expo.modules.libvlcplayer

import android.content.Context
import android.os.PowerManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.enums.AudioMixingMode
import expo.modules.libvlcplayer.enums.VideoContentFit
import expo.modules.libvlcplayer.managers.MediaPlayerManager
import expo.modules.libvlcplayer.records.Slave
import expo.modules.libvlcplayer.records.Tracks

private const val BUFFERING_EVENT = "onBuffering"
private const val PLAYING_EVENT = "onPlaying"
private const val PAUSED_EVENT = "onPaused"
private const val STOPPED_EVENT = "onStopped"
private const val END_REACHED_EVENT = "onEndReached"
private const val ENCOUNTERED_ERROR_EVENT = "onEncounteredError"
private const val DIALOG_DISPLAY_EVENT = "onDialogDisplay"
private const val TIME_CHANGED_EVENT = "onTimeChanged"
private const val POSITION_CHANGED_EVENT = "onPositionChanged"
private const val ES_ADDED_EVENT = "onESAdded"
private const val RECORD_CHANGED_EVENT = "onRecordChanged"
private const val SNAPSHOT_TAKEN_EVENT = "onSnapshotTaken"
private const val FIRST_PLAY_EVENT = "onFirstPlay"
private const val FOREGROUND_EVENT = "onForeground"
private const val BACKGROUND_EVENT = "onBackground"

val playerEvents =
    arrayOf(
        BUFFERING_EVENT,
        PLAYING_EVENT,
        PAUSED_EVENT,
        STOPPED_EVENT,
        END_REACHED_EVENT,
        ENCOUNTERED_ERROR_EVENT,
        DIALOG_DISPLAY_EVENT,
        TIME_CHANGED_EVENT,
        POSITION_CHANGED_EVENT,
        ES_ADDED_EVENT,
        RECORD_CHANGED_EVENT,
        SNAPSHOT_TAKEN_EVENT,
        FIRST_PLAY_EVENT,
        FOREGROUND_EVENT,
        BACKGROUND_EVENT,
    )

class LibVlcPlayerModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    override fun definition() =
        ModuleDefinition {
            Name("ExpoLibVlcPlayer")

            AsyncFunction("checkBatteryOptimization") {
                val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
                return@AsyncFunction powerManager?.isIgnoringBatteryOptimizations(context.packageName) == false
            }

            OnCreate {
                MediaPlayerManager.onModuleCreate(appContext)
            }

            OnDestroy {
                MediaPlayerManager.onModuleDestroy()
            }

            OnActivityEntersForeground {
                MediaPlayerManager.keepAwakeManager.activateKeepAwake()
                MediaPlayerManager.onModuleForeground()
            }

            OnActivityEntersBackground {
                MediaPlayerManager.keepAwakeManager.deactivateKeepAwake()
                MediaPlayerManager.onModuleBackground()
            }

            View(LibVlcPlayerView::class) {
                Events(playerEvents)

                Prop("source") { view: LibVlcPlayerView, source: String? ->
                    view.source = source
                }

                Prop("options", ArrayList<String>()) { view: LibVlcPlayerView, options: ArrayList<String> ->
                    view.options = options
                }

                Prop("tracks") { view: LibVlcPlayerView, tracks: Tracks? ->
                    view.tracks = tracks
                }

                Prop("slaves", ArrayList<Slave>()) { view: LibVlcPlayerView, slaves: ArrayList<Slave> ->
                    view.slaves = slaves
                }

                Prop("scale", MediaPlayerConstants.DEFAULT_PLAYER_SCALE) { view: LibVlcPlayerView, scale: Float ->
                    view.scale = scale
                }

                Prop("contentFit", VideoContentFit.CONTAIN) { view: LibVlcPlayerView, contentFit: VideoContentFit ->
                    view.contentFit = contentFit
                }

                Prop("rate", MediaPlayerConstants.DEFAULT_PLAYER_RATE) { view: LibVlcPlayerView, rate: Float ->
                    view.rate = rate
                }

                Prop("time", MediaPlayerConstants.DEFAULT_PLAYER_TIME) { view: LibVlcPlayerView, time: Int ->
                    view.time = time
                }

                Prop("volume", MediaPlayerConstants.MAX_PLAYER_VOLUME) { view: LibVlcPlayerView, volume: Int ->
                    view.volume = volume
                }

                Prop("mute", false) { view: LibVlcPlayerView, mute: Boolean ->
                    view.mute = mute
                }

                Prop("audioMixingMode", AudioMixingMode.AUTO) { view: LibVlcPlayerView, audioMixingMode: AudioMixingMode ->
                    view.audioMixingMode = audioMixingMode
                }

                Prop("playInBackground", false) { view: LibVlcPlayerView, playInBackground: Boolean ->
                    view.playInBackground = playInBackground
                }

                Prop("repeat", false) { view: LibVlcPlayerView, repeat: Boolean ->
                    view.repeat = repeat
                }

                Prop("autoplay", true) { view: LibVlcPlayerView, autoplay: Boolean ->
                    view.autoplay = autoplay
                }

                OnViewDestroys { view: LibVlcPlayerView ->
                    MediaPlayerManager.unregisterPlayerView(view)
                    view.destroyPlayer()
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
                    view.seek(value, type ?: "time")
                }

                AsyncFunction("record") { view: LibVlcPlayerView, path: String? ->
                    view.record(path)
                }

                AsyncFunction("snapshot") { view: LibVlcPlayerView, path: String ->
                    view.snapshot(path)
                }

                AsyncFunction("postAction") { view: LibVlcPlayerView, action: Int ->
                    view.postAction(action)
                }

                AsyncFunction("dismiss") { view: LibVlcPlayerView ->
                    view.dismiss()
                }
            }
        }
}
