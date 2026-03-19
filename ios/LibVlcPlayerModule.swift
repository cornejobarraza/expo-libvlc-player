import AVKit
import ExpoModulesCore

private let playerEvents = [
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
]

public class LibVlcPlayerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoLibVlcPlayer")

        AsyncFunction("triggerNetworkAlert") {
            MediaPlayerManager.shared.localNetworkManager.triggerNetworkAlert()
        }

        Function("isPictureInPictureSupported") {
            AVPictureInPictureController.isPictureInPictureSupported()
        }

        OnDestroy {
            MediaPlayerManager.shared.onModuleDestroy()
        }

        OnAppEntersForeground {
            MediaPlayerManager.shared.keepAwakeManager.toggleKeepAwake()
            MediaPlayerManager.shared.onModuleForeground()
        }

        OnAppEntersBackground {
            MediaPlayerManager.shared.keepAwakeManager.deactivateKeepAwake()
            MediaPlayerManager.shared.onModuleBackground()
        }

        View(LibVlcPlayerView.self) {
            Events(playerEvents)

            Prop("source") { (view: LibVlcPlayerView, source: String?) in
                view.source = source
            }

            Prop("options", .init()) { (view: LibVlcPlayerView, options: [String]) in
                view.options = options
            }

            Prop("tracks") { (view: LibVlcPlayerView, tracks: Tracks?) in
                view.tracks = tracks
            }

            Prop("slaves", .init()) { (view: LibVlcPlayerView, slaves: [Slave]) in
                view.slaves = slaves
            }

            Prop("scale", MediaPlayerConstants.defaultPlayerScale) { (view: LibVlcPlayerView, scale: Float) in
                view.scale = scale
            }

            Prop("contentFit", .contain) { (view: LibVlcPlayerView, contentFit: VideoContentFit) in
                view.contentFit = contentFit
            }

            Prop("rate", MediaPlayerConstants.defaultPlayerRate) { (view: LibVlcPlayerView, rate: Float) in
                view.rate = rate
            }

            Prop("time", MediaPlayerConstants.defaultPlayerTime) { (view: LibVlcPlayerView, time: Int) in
                view.time = time
            }

            Prop("volume", MediaPlayerConstants.maxPlayerVolume) { (view: LibVlcPlayerView, volume: Int) in
                view.volume = volume
            }

            Prop("mute", false) { (view: LibVlcPlayerView, mute: Bool) in
                view.mute = mute
            }

            Prop("audioMixingMode", .auto) { (view: LibVlcPlayerView, audioMixingMode: AudioMixingMode) in
                view.audioMixingMode = audioMixingMode
            }

            Prop("repeat", false) { (view: LibVlcPlayerView, shouldRepeat: Bool) in
                view.shouldRepeat = shouldRepeat
            }

            Prop("autoplay", true) { (view: LibVlcPlayerView, autoplay: Bool) in
                view.autoplay = autoplay
            }

            Prop("pictureInPicture", false) { (view: LibVlcPlayerView, pictureInPicture: Bool) in
                view.pictureInPicture = pictureInPicture
            }

            OnViewDidUpdateProps { (view: LibVlcPlayerView) in
                view.initPlayer()
            }

            AsyncFunction("play") { (view: LibVlcPlayerView) in
                view.play()
            }

            AsyncFunction("pause") { (view: LibVlcPlayerView) in
                view.pause()
            }

            AsyncFunction("stop") { (view: LibVlcPlayerView) in
                view.stop()
            }

            AsyncFunction("seek") { (view: LibVlcPlayerView, value: Double, type: String?) in
                view.seek(value, type)
            }

            AsyncFunction("record") { (view: LibVlcPlayerView, path: String?) in
                view.record(path)
            }

            AsyncFunction("snapshot") { (view: LibVlcPlayerView, path: String) in
                view.snapshot(path)
            }

            AsyncFunction("postAction") { (view: LibVlcPlayerView, action: Int) in
                view.postAction(action)
            }

            AsyncFunction("dismiss") { (view: LibVlcPlayerView) in
                view.dismiss()
            }

            AsyncFunction("startPictureInPicture") { (view: LibVlcPlayerView) in
                try view.startPictureInPicture()
            }

            AsyncFunction("stopPictureInPicture") { (view: LibVlcPlayerView) in
                view.stopPictureInPicture()
            }
        }
    }
}
