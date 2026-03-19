package expo.modules.libvlcplayer

import android.app.Activity
import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.enums.AudioMixingMode
import expo.modules.libvlcplayer.enums.VideoContentFit
import expo.modules.libvlcplayer.managers.MediaPlayerManager
import expo.modules.libvlcplayer.records.Slave
import expo.modules.libvlcplayer.records.Tracks

private val PLAYER_EVENTS =
    arrayOf(
        "onBuffering",
        "onPlaying",
        "onPaused",
        "onStopped",
        "onEncounteredError",
        "onDialogDisplay",
        "onTimeChanged",
        "onPositionChanged",
        "onESAdded",
        "onRecordChanged",
        "onSnapshotTaken",
        "onFirstPlay",
        "onForeground",
        "onBackground",
        "onPictureInPictureStart",
        "onPictureInPictureStop",
    )

class LibVlcPlayerModule : Module() {
    private val activity: Activity
        get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()

    override fun definition() =
        ModuleDefinition {
            Name("ExpoLibVlcPlayer")

            Function("isPictureInPictureSupported") {
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                    activity.packageManager.hasSystemFeature(
                        android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE,
                    )
            }

            OnCreate {
                MediaPlayerManager.onModuleCreate(appContext)
            }

            OnDestroy {
                MediaPlayerManager.onModuleDestroy()
            }

            OnActivityEntersForeground {
                MediaPlayerManager.keepAwakeManager.toggleKeepAwake()
                MediaPlayerManager.onModuleForeground()
            }

            OnActivityEntersBackground {
                MediaPlayerManager.keepAwakeManager.deactivateKeepAwake()
                MediaPlayerManager.onModuleBackground()
            }

            View(LibVlcPlayerView::class) {
                Events(PLAYER_EVENTS)

                Prop("source") { view: LibVlcPlayerView, source: String? ->
                    view.source = source
                }

                Prop("options", mutableListOf()) { view: LibVlcPlayerView, options: MutableList<String> ->
                    view.options = options
                }

                Prop("tracks") { view: LibVlcPlayerView, tracks: Tracks? ->
                    view.tracks = tracks
                }

                Prop("slaves", mutableListOf()) { view: LibVlcPlayerView, slaves: MutableList<Slave> ->
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

                Prop("repeat", false) { view: LibVlcPlayerView, repeat: Boolean ->
                    view.repeat = repeat
                }

                Prop("autoplay", true) { view: LibVlcPlayerView, autoplay: Boolean ->
                    view.autoplay = autoplay
                }

                Prop("pictureInPicture", false) { view: LibVlcPlayerView, pictureInPicture: Boolean ->
                    view.pictureInPicture = pictureInPicture
                }

                OnViewDidUpdateProps { view: LibVlcPlayerView ->
                    view.initPlayer()
                }

                OnViewDestroys { view: LibVlcPlayerView ->
                    MediaPlayerManager.unregisterExpoView(view)
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
                    view.seek(value, type)
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

                AsyncFunction("startPictureInPicture") { view: LibVlcPlayerView ->
                    view.startPictureInPicture()
                }
            }
        }
}
