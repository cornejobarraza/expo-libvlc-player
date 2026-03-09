import ExpoModulesCore

private let playerEvents = [
    "onBuffering",
    "onPlaying",
    "onPaused",
    "onStopped",
    "onEndReached",
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
]

public class LibVlcPlayerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoLibVlcPlayer")

        AsyncFunction("triggerNetworkAlert") {
            MediaPlayerManager.shared.localNetworkManager.triggerNetworkAlert()
        }

        OnDestroy {
            MediaPlayerManager.shared.onModuleDestroy()
        }

        OnAppEntersForeground {
            MediaPlayerManager.shared.keepAwakeManager.activateKeepAwake()
            MediaPlayerManager.shared.onModuleForeground()
        }

        OnAppEntersBackground {
            MediaPlayerManager.shared.keepAwakeManager.deactivateKeepAwake()
            MediaPlayerManager.shared.onModuleBackground()
        }

        View(LibVlcPlayerView.self) {
            Events(playerEvents)

            Prop("source") { (view: LibVlcPlayerView, source: String?) in
                if source != view.source {
                    view.source = source
                }
            }

            Prop("options", .init()) { (view: LibVlcPlayerView, options: [String]) in
                if options != view.options {
                    view.options = options
                }
            }

            Prop("tracks") { (view: LibVlcPlayerView, tracks: Tracks?) in
                if tracks != view.tracks {
                    view.tracks = tracks
                }
            }

            Prop("slaves", .init()) { (view: LibVlcPlayerView, slaves: [Slave]) in
                if slaves != view.slaves {
                    view.slaves = slaves
                }
            }

            Prop("scale", MediaPlayerConstants.defaultPlayerScale) { (view: LibVlcPlayerView, scale: Float) in
                if scale != view.scale {
                    view.scale = scale
                }
            }

            Prop("contentFit", .contain) { (view: LibVlcPlayerView, contentFit: VideoContentFit) in
                if contentFit != view.contentFit {
                    view.contentFit = contentFit
                }
            }

            Prop("rate", MediaPlayerConstants.defaultPlayerRate) { (view: LibVlcPlayerView, rate: Float) in
                if rate != view.rate {
                    view.rate = rate
                }
            }

            Prop("time", MediaPlayerConstants.defaultPlayerTime) { (view: LibVlcPlayerView, time: Int) in
                if time != view.time {
                    view.time = time
                }
            }

            Prop("volume", MediaPlayerConstants.maxPlayerVolume) { (view: LibVlcPlayerView, volume: Int) in
                if volume != view.volume {
                    view.volume = volume
                }
            }

            Prop("mute", false) { (view: LibVlcPlayerView, mute: Bool) in
                if mute != view.mute {
                    view.mute = mute
                }
            }

            Prop("audioMixingMode", .auto) { (view: LibVlcPlayerView, audioMixingMode: AudioMixingMode) in
                if audioMixingMode != view.audioMixingMode {
                    view.audioMixingMode = audioMixingMode
                }
            }

            Prop("repeat", false) { (view: LibVlcPlayerView, shouldRepeat: Bool) in
                if shouldRepeat != view.shouldRepeat {
                    view.shouldRepeat = shouldRepeat
                }
            }

            Prop("autoplay", true) { (view: LibVlcPlayerView, autoplay: Bool) in
                if autoplay != view.autoplay {
                    view.autoplay = autoplay
                }
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
                view.seek(value, type ?? "time")
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
        }
    }
}
