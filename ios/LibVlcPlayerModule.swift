import ExpoModulesCore

private let bufferingEvent = "onBuffering"
private let playingEvent = "onPlaying"
private let pausedEvent = "onPaused"
private let stoppedEvent = "onStopped"
private let endReachedEvent = "onEndReached"
private let encounteredErrorEvent = "onEncounteredError"
private let positionChangedEvent = "onPositionChanged"
private let esAddedEvent = "onESAdded"
private let dialogDisplayEvent = "onDialogDisplay"
private let firstPlayEvent = "onFirstPlay"
private let backgroundEvent = "onBackground"

let playerEvents = [
    bufferingEvent,
    playingEvent,
    pausedEvent,
    stoppedEvent,
    endReachedEvent,
    encounteredErrorEvent,
    positionChangedEvent,
    esAddedEvent,
    dialogDisplayEvent,
    firstPlayEvent,
    backgroundEvent,
]

public class LibVlcPlayerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoLibVlcPlayer")

        OnDestroy {
            MediaPlayerManager.shared.onModuleDestroyed()
        }

        View(LibVlcPlayerView.self) {
            Events(playerEvents)

            Prop("source") { (view: LibVlcPlayerView, source: String?) in
                view.source = source
            }

            Prop("options") { (view: LibVlcPlayerView, options: [String]?) in
                view.options = options ?? [String]()
            }

            Prop("tracks") { (view: LibVlcPlayerView, tracks: Tracks?) in
                view.tracks = tracks
            }

            Prop("slaves") { (view: LibVlcPlayerView, slaves: [Slave]?) in
                view.slaves = slaves ?? [Slave]()
            }

            Prop("scale") { (view: LibVlcPlayerView, scale: Float?) in
                view.scale = scale ?? defaultPlayerScale
            }

            Prop("aspectRatio") { (view: LibVlcPlayerView, aspectRatio: String?) in
                view.aspectRatio = aspectRatio
            }

            Prop("rate") { (view: LibVlcPlayerView, rate: Float?) in
                view.rate = rate ?? defaultPlayerRate
            }

            Prop("time") { (view: LibVlcPlayerView, time: Int?) in
                view.time = time ?? defaultPlayerTime
            }

            Prop("volume") { (view: LibVlcPlayerView, volume: Int?) in
                view.volume = volume ?? maxPlayerVolume
            }

            Prop("mute") { (view: LibVlcPlayerView, mute: Bool?) in
                view.mute = mute ?? false
            }

            Prop("audioMixingMode") { (view: LibVlcPlayerView, audioMixingMode: AudioMixingMode?) in
                view.audioMixingMode = audioMixingMode ?? .auto
            }

            Prop("repeat") { (view: LibVlcPlayerView, shouldRepeat: Bool?) in
                view.shouldRepeat = shouldRepeat ?? false
            }

            Prop("playInBackground") { (view: LibVlcPlayerView, playInBackground: Bool?) in
                view.playInBackground = playInBackground ?? false
            }

            Prop("autoplay") { (view: LibVlcPlayerView, autoplay: Bool?) in
                view.autoplay = autoplay ?? true
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

            AsyncFunction("seek") { (view: LibVlcPlayerView, position: Float) in
                view.seek(position)
            }

            AsyncFunction("postAction") { (view: LibVlcPlayerView, action: Int) in
                view.postAction(action)
            }

            AsyncFunction("dismiss") { (view: LibVlcPlayerView) in
                view.dismiss()
            }
        }

        OnAppEntersBackground {
            MediaPlayerManager.shared.onAppBackground()
        }
    }
}
