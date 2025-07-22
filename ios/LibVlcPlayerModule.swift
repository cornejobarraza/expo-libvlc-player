import ExpoModulesCore

private let bufferingEvent = "onBuffering"
private let playingEvent = "onPlaying"
private let pausedEvent = "onPaused"
private let stoppedEvent = "onStopped"
private let endReachedEvent = "onEndReached"
private let encounteredErrorEvent = "onEncounteredError"
private let positionChangedEvent = "onPositionChanged"
private let parsedChangedEvent = "onParsedChanged"
private let backgroundEvent = "onBackground"

let playerEvents = [
    bufferingEvent,
    playingEvent,
    pausedEvent,
    stoppedEvent,
    endReachedEvent,
    encounteredErrorEvent,
    positionChangedEvent,
    parsedChangedEvent,
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

            Prop("uri") { (view: LibVlcPlayerView, uri: String) in
                view.uri = uri
            }

            Prop("options") { (view: LibVlcPlayerView, options: [String]?) in
                view.options = options ?? [String]()
            }

            Prop("slaves") { (view: LibVlcPlayerView, slaves: [[String: Any]]?) in
                view.slaves = slaves
            }

            Prop("tracks") { (view: LibVlcPlayerView, tracks: [String: Any]?) in
                view.tracks = tracks
            }

            Prop("volume") { (view: LibVlcPlayerView, volume: Int?) in
                view.volume = volume ?? maxPlayerVolume
            }

            Prop("mute") { (view: LibVlcPlayerView, mute: Bool?) in
                view.mute = mute ?? false
            }

            Prop("rate") { (view: LibVlcPlayerView, rate: Float?) in
                view.rate = rate ?? defaultPlayerRate
            }

            Prop("time") { (view: LibVlcPlayerView, time: Int?) in
                view.time = time ?? defaultPlayerTime
            }

            Prop("repeat") { (view: LibVlcPlayerView, shouldRepeat: Bool?) in
                view.shouldRepeat = shouldRepeat ?? false
            }

            Prop("aspectRatio") { (view: LibVlcPlayerView, aspectRatio: String?) in
                view.aspectRatio = aspectRatio
            }

            Prop("audioMixingMode") { (view: LibVlcPlayerView, audioMixingMode: AudioMixingMode?) in
                view.audioMixingMode = audioMixingMode ?? .auto
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
        }

        OnAppEntersForeground {
            MediaPlayerManager.shared.onAppForeground()
        }

        OnAppEntersBackground {
            MediaPlayerManager.shared.onAppBackground()
        }
    }
}
