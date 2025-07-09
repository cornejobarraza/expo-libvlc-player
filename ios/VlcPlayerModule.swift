import AVFoundation
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
]

public class VlcPlayerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoLibVlcPlayer")

        OnDestroy {
            VlcPlayerManager.shared.onAppDestroyed()
        }

        View(VlcPlayerView.self) {
            Events(playerEvents)

            Prop("uri") { (view: VlcPlayerView, uri: String) in
                view.setUri(uri)
            }

            Prop("subtitle") { (view: VlcPlayerView, subtitle: [String: Any]?) in
                view.setSubtitle(subtitle)
            }

            Prop("options") { (view: VlcPlayerView, options: [String]?) in
                view.setOptions(options ?? [String]())
            }

            Prop("volume") { (view: VlcPlayerView, volume: Int?) in
                view.setVolume(volume ?? maxPlayerVolume)
            }

            Prop("mute") { (view: VlcPlayerView, mute: Bool?) in
                view.setMute(mute ?? false)
            }

            Prop("rate") { (view: VlcPlayerView, rate: Float?) in
                view.setRate(rate ?? defaultPlayerRate)
            }

            Prop("tracks") { (view: VlcPlayerView, tracks: [String: Any]?) in
                view.setTracks(tracks)
            }

            Prop("time") { (view: VlcPlayerView, time: Int?) in
                view.setTime(time ?? defaultPlayerStart)
            }

            Prop("repeat") { (view: VlcPlayerView, shouldRepeat: Bool?) in
                view.setRepeat(shouldRepeat ?? false)
            }

            Prop("aspectRatio") { (view: VlcPlayerView, aspectRatio: String?) in
                view.setAspectRatio(aspectRatio)
            }

            Prop("audioMixingMode") { (view: VlcPlayerView, audioMixingMode: AudioMixingMode?) in
                view.setAudioMixingMode(audioMixingMode ?? .auto)
            }

            Prop("playInBackground") { (view: VlcPlayerView, playInBackground: Bool?) in
                view.setPlayInBackground(playInBackground ?? false)
            }

            Prop("autoplay") { (view: VlcPlayerView, autoplay: Bool?) in
                view.setAutoplay(autoplay ?? true)
            }

            OnViewDidUpdateProps { (view: VlcPlayerView) in
                view.initPlayer()
            }

            AsyncFunction("play") { (view: VlcPlayerView) in
                view.play()
            }

            AsyncFunction("pause") { (view: VlcPlayerView) in
                view.pause()
            }

            AsyncFunction("stop") { (view: VlcPlayerView) in
                view.stop()
            }

            AsyncFunction("seek") { (view: VlcPlayerView, position: Float) in
                view.seek(position)
            }
        }

        OnAppEntersForeground {
            VlcPlayerManager.shared.onAppForegrounded()
        }

        OnAppEntersBackground {
            VlcPlayerManager.shared.onAppBackgrounded()
        }
    }
}
