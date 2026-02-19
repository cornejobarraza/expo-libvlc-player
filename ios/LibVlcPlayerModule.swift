import ExpoModulesCore

private let bufferingEvent = "onBuffering"
private let playingEvent = "onPlaying"
private let pausedEvent = "onPaused"
private let stoppedEvent = "onStopped"
private let endReachedEvent = "onEndReached"
private let encounteredErrorEvent = "onEncounteredError"
private let dialogDisplayEvent = "onDialogDisplay"
private let timeChangedEvent = "onTimeChanged"
private let positionChangedEvent = "onPositionChanged"
private let esAddedEvent = "onESAdded"
private let recordChangedEvent = "onRecordChanged"
private let snapshotTakenEvent = "onSnapshotTaken"
private let firstPlayEvent = "onFirstPlay"
private let foregroundEvent = "onForeground"
private let backgroundEvent = "onBackground"

let playerEvents = [
    bufferingEvent,
    playingEvent,
    pausedEvent,
    stoppedEvent,
    endReachedEvent,
    encounteredErrorEvent,
    dialogDisplayEvent,
    timeChangedEvent,
    positionChangedEvent,
    esAddedEvent,
    recordChangedEvent,
    snapshotTakenEvent,
    firstPlayEvent,
    foregroundEvent,
    backgroundEvent,
]

public class LibVlcPlayerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoLibVlcPlayer")

        AsyncFunction("triggerNetworkAlert") {
            LocalNetworkManager.shared.triggerLocalNetworkPrivacyAlert()
        }

        OnDestroy {
            MediaPlayerManager.shared.onModuleDestroy()
        }

        OnAppEntersForeground {
            MediaPlayerManager.shared.onModuleForeground()
        }

        OnAppEntersBackground {
            MediaPlayerManager.shared.onModuleBackground()
        }

        View(LibVlcPlayerView.self) {
            Events(playerEvents)

            Prop("source") { (view: LibVlcPlayerView, source: String?) in
                if source != view.source {
                    view.source = source
                }
            }

            Prop("options") { (view: LibVlcPlayerView, options: [String]?) in
                if options != view.options {
                    view.options = options ?? [String]()
                }
            }

            Prop("tracks") { (view: LibVlcPlayerView, tracks: Tracks?) in
                if tracks != view.tracks {
                    view.tracks = tracks
                }
            }

            Prop("slaves") { (view: LibVlcPlayerView, slaves: [Slave]?) in
                if slaves != view.slaves {
                    view.slaves = slaves ?? [Slave]()
                }
            }

            Prop("scale") { (view: LibVlcPlayerView, scale: Float?) in
                if scale != view.scale {
                    view.scale = scale ?? defaultPlayerScale
                }
            }

            Prop("aspectRatio") { (view: LibVlcPlayerView, aspectRatio: String?) in
                if aspectRatio != view.aspectRatio {
                    view.aspectRatio = aspectRatio
                }
            }

            Prop("contentFit") { (view: LibVlcPlayerView, contentFit: VideoContentFit?) in
                if contentFit != view.contentFit {
                    view.contentFit = contentFit ?? .contain
                }
            }

            Prop("rate") { (view: LibVlcPlayerView, rate: Float?) in
                if rate != view.rate {
                    view.rate = rate ?? defaultPlayerRate
                }
            }

            Prop("time") { (view: LibVlcPlayerView, time: Int?) in
                if time != view.time {
                    view.time = time ?? defaultPlayerTime
                }
            }

            Prop("volume") { (view: LibVlcPlayerView, volume: Int?) in
                if volume != view.volume {
                    view.volume = volume ?? maxPlayerVolume
                }
            }

            Prop("mute") { (view: LibVlcPlayerView, mute: Bool?) in
                if mute != view.mute {
                    view.mute = mute ?? false
                }
            }

            Prop("audioMixingMode") { (view: LibVlcPlayerView, audioMixingMode: AudioMixingMode?) in
                if audioMixingMode != view.audioMixingMode {
                    view.audioMixingMode = audioMixingMode ?? .auto
                }
            }

            Prop("playInBackground") { (view: LibVlcPlayerView, playInBackground: Bool?) in
                if playInBackground != view.playInBackground {
                    view.playInBackground = playInBackground ?? false
                }
            }

            Prop("repeat") { (view: LibVlcPlayerView, shouldRepeat: Bool?) in
                if shouldRepeat != view.shouldRepeat {
                    view.shouldRepeat = shouldRepeat ?? false
                }
            }

            Prop("autoplay") { (view: LibVlcPlayerView, autoplay: Bool?) in
                if autoplay != view.autoplay {
                    view.autoplay = autoplay ?? true
                }
            }

            OnViewDidUpdateProps { (view: LibVlcPlayerView) in
                view.createPlayer()
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
