import ExpoModulesCore
import MobileVLCKit
import UIKit

let defaultPlayerRate: Float = 1.0
let defaultPlayerStart: Int = 0
let minPlayerVolume: Int = 0
let maxPlayerVolume: Int = 100
let playerVolumeStep: Int = 10

private let useTextureViews = false
private let enableSubtitles = true

class VlcPlayerView: ExpoView {
    let playerView = UIView()

    var mediaPlayer: VLCMediaPlayer?

    private var uri: String = ""
    var options: [String] = []
    private var userVolume: Int = maxPlayerVolume
    var time: Int? = defaultPlayerStart
    var shouldRepeat: Bool = false
    var audioMixingMode: AudioMixingMode = .auto
    var playInBackground: Bool = false
    private var autoplay: Bool = true

    let onBuffering = EventDispatcher()
    let onPlaying = EventDispatcher()
    let onPaused = EventDispatcher()
    let onStopped = EventDispatcher()
    let onEnded = EventDispatcher()
    let onRepeat = EventDispatcher()
    let onError = EventDispatcher()
    let onPositionChanged = EventDispatcher()
    let onLoad = EventDispatcher()
    let onBackground = EventDispatcher()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        VlcPlayerManager.shared.registerView(view: self)

        clipsToBounds = true
        playerView.backgroundColor = .black
        addSubview(playerView)
    }

    override func layoutSubviews() {
        playerView.frame = bounds
    }

    func createPlayer() {
        destroyPlayer()
        mediaPlayer = VLCMediaPlayer(options: options)
        mediaPlayer!.delegate = self
        mediaPlayer!.drawable = playerView
    }

    func setupPlayer() {
        guard let player = mediaPlayer else { return }

        guard let url = URL(string: uri) else {
            let error = ["error": "Invalid URI, media could not be set"]
            onError(error)
            return
        }

        player.media = VLCMedia(url: url)
        player.media!.delegate = self

        if autoplay {
            player.play()
        }
    }

    func destroyPlayer() {
        mediaPlayer?.media?.delegate = nil
        mediaPlayer?.media = nil
        if let player = mediaPlayer {
            player.stop()
            player.drawable = nil
            player.delegate = nil
        }
        mediaPlayer = nil
    }

    func setUri(_ uri: String) {
        let old = self.uri
        self.uri = uri

        if uri != old {
            if mediaPlayer == nil {
                createPlayer()
            }
            setupPlayer()
        }
    }

    func setSubtitle(_ subtitle: [String: Any]?) {
        guard let player = mediaPlayer,
              let subtitle = subtitle,
              !subtitle.isEmpty else { return }

        let uri = subtitle["uri"] as? String ?? ""

        guard let url = URL(string: uri) else {
            let error = ["error": "Invalid URI, subtitle could not be set"]
            onError(error)
            return
        }

        let enable = subtitle["enable"] as? Bool ?? enableSubtitles

        player.addPlaybackSlave(url, type: .subtitle, enforce: enable)
    }

    func setOptions(_ options: [String]) {
        guard !options.isEmpty else { return }

        let old = self.options
        self.options = options

        if options != old {
            createPlayer()
            setupPlayer()
        }
    }

    func setVolume(_ volume: Int) {
        guard let player = mediaPlayer else { return }

        let newVolume = max(minPlayerVolume, min(maxPlayerVolume, volume))
        userVolume = newVolume

        player.audio?.volume = Int32(newVolume)
        VlcPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setMute(_ mute: Bool) {
        guard let player = mediaPlayer else { return }

        let newVolume = !mute ?
            max(playerVolumeStep, min(maxPlayerVolume, userVolume)) :
            minPlayerVolume

        player.audio?.volume = Int32(newVolume)
        VlcPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setRate(_ rate: Float) {
        guard let player = mediaPlayer else { return }

        player.rate = rate
    }

    func setTracks(_ tracks: [String: Any]?) {
        guard let player = mediaPlayer,
              let tracks = tracks,
              !tracks.isEmpty else { return }

        let audioTrack = tracks["audio"] as? Int ?? -1
        let subtitleTrack = tracks["subtitle"] as? Int ?? -1

        player.currentAudioTrackIndex = Int32(audioTrack)
        player.currentVideoSubTitleIndex = Int32(subtitleTrack)
    }

    func setTime(_ time: Int?) {
        self.time = time
    }

    func setRepeat(_ shouldRepeat: Bool) {
        if shouldRepeat, options.hasRepeatOptions() {
            let error = ["error": "Repeat already enabled in options"]
            return onError(error)
        }

        self.shouldRepeat = shouldRepeat
    }

    func setAspectRatio(_ aspectRatio: String?) {
        guard let player = mediaPlayer,
              let aspectRatio = aspectRatio else { return }

        aspectRatio.withCString { cString in
            player.videoAspectRatio = UnsafeMutablePointer(mutating: cString)
        }
    }

    func setAudioMixingMode(_ audioMixingMode: AudioMixingMode) {
        self.audioMixingMode = audioMixingMode
        VlcPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setPlayInBackground(_ playInBackground: Bool) {
        self.playInBackground = playInBackground
        VlcPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setAutoplay(_ autoplay: Bool) {
        self.autoplay = autoplay
    }

    func play() {
        mediaPlayer?.play()
    }

    func pause() {
        mediaPlayer?.pause()
    }

    func stop() {
        mediaPlayer?.stop()
    }

    func seek(_ position: Float) {
        guard let player = mediaPlayer else { return }

        if player.isSeekable {
            player.position = position
        } else {
            let error = ["error": "Media is not seekable"]
            onError(error)
        }
    }

    deinit {
        VlcPlayerManager.shared.unregisterView(view: self)
        destroyPlayer()
    }
}

extension Array where Element == String {
    func hasRepeatOptions() -> Bool {
        let prefixes: Set<String> = [
            "--input-repeat=", "-input-repeat=", ":input-repeat=",
        ]

        return contains { arg in
            prefixes.contains { prefix in
                arg.hasPrefix(prefix)
            }
        }
    }
}
