import ExpoModulesCore

private let bufferingEvent = "onBuffering"
private let playingEvent = "onPlaying"
private let pausedEvent = "onPaused"
private let stoppedEvent = "onStopped"
private let endedEvent = "onEnded"
private let repeatEvent = "onRepeat"
private let errorEvent = "onError"
private let positionChangedEvent = "onPositionChanged"
private let loadEvent = "onLoad"
private let backgroundEvent = "onBackground"

let playerEvents = [
    bufferingEvent,
    playingEvent,
    pausedEvent,
    stoppedEvent,
    endedEvent,
    repeatEvent,
    errorEvent,
    positionChangedEvent,
    loadEvent,
    backgroundEvent,
]

public class LibVlcPlayerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoLibVlcPlayer")

        OnDestroy {
            MediaPlayerManager.shared.onAppDestroyed()
        }

        View(LibVlcPlayerView.self) {
            Events(playerEvents)

            Prop("uri") { (view: LibVlcPlayerView, uri: String) in
                view.setUri(uri)
            }

            Prop("subtitle") { (view: LibVlcPlayerView, subtitle: [String: Any]?) in
                view.setSubtitle(subtitle)
            }

            Prop("options") { (view: LibVlcPlayerView, options: [String]?) in
                view.setOptions(options ?? [String]())
            }

            Prop("volume") { (view: LibVlcPlayerView, volume: Int?) in
                view.setVolume(volume ?? maxPlayerVolume)
            }

            Prop("mute") { (view: LibVlcPlayerView, mute: Bool?) in
                view.setMute(mute ?? false)
            }

            Prop("rate") { (view: LibVlcPlayerView, rate: Float?) in
                view.setRate(rate ?? defaultPlayerRate)
            }

            Prop("tracks") { (view: LibVlcPlayerView, tracks: [String: Any]?) in
                view.setTracks(tracks)
            }

            Prop("time") { (view: LibVlcPlayerView, time: Int?) in
                view.setTime(time ?? defaultPlayerStart)
            }

            Prop("repeat") { (view: LibVlcPlayerView, shouldRepeat: Bool?) in
                view.setRepeat(shouldRepeat ?? false)
            }

            Prop("aspectRatio") { (view: LibVlcPlayerView, aspectRatio: String?) in
                view.setAspectRatio(aspectRatio)
            }

            Prop("audioMixingMode") { (view: LibVlcPlayerView, audioMixingMode: AudioMixingMode?) in
                view.setAudioMixingMode(audioMixingMode ?? .auto)
            }

            Prop("playInBackground") { (view: LibVlcPlayerView, playInBackground: Bool?) in
                view.setPlayInBackground(playInBackground ?? false)
            }

            Prop("autoplay") { (view: LibVlcPlayerView, autoplay: Bool?) in
                view.setAutoplay(autoplay ?? true)
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

        OnAppEntersBackground {
            MediaPlayerManager.shared.onAppBackgrounded()
        }
    }
}
