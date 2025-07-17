import ExpoModulesCore
import MobileVLCKit
import UIKit

let defaultPlayerRate: Float = 1.0
let defaultPlayerStart: Int = 0
let minPlayerVolume: Int = 0
let maxPlayerVolume: Int = 100
let playerVolumeStep: Int = 10

class LibVlcPlayerView: ExpoView {
    private let playerView = UIView()

    var mediaPlayer: VLCMediaPlayer?

    private var shouldCreate: Bool = false
    private var shouldSetup: Bool = false

    private var uri: String = ""
    private var options: [String] = .init()
    private var slaves: [[String: Any]]?
    private var tracks: [String: Any]?
    private var userVolume: Int = maxPlayerVolume
    var time: Int = defaultPlayerStart
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

        MediaPlayerManager.shared.registerView(view: self)

        clipsToBounds = true
        playerView.backgroundColor = .black
        addSubview(playerView)
    }

    override func layoutSubviews() {
        playerView.frame = bounds
    }

    func buildPlayer() {
        if shouldCreate {
            createPlayer()
        }

        if shouldSetup {
            setupPlayer()
        }
    }

    func createPlayer() {
        destroyPlayer()
        mediaPlayer = VLCMediaPlayer(options: options)
        mediaPlayer!.delegate = self
        mediaPlayer!.drawable = playerView
        shouldCreate = false
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

        addPlayerSlaves()

        if autoplay {
            player.play()
        }

        shouldSetup = false
    }

    func destroyPlayer() {
        mediaPlayer?.media = nil
        mediaPlayer?.stop()
        mediaPlayer = nil
    }

    func setUri(_ uri: String) {
        let old = self.uri
        self.uri = uri

        shouldCreate = uri != old && mediaPlayer == nil
        shouldSetup = uri != old
    }

    func setOptions(_ options: [String]) {
        let old = self.options
        self.options = options

        shouldCreate = options != old
        shouldSetup = options != old
    }

    func addPlayerSlave(_ slave: [[String: Any]]) {
        let uri = slave["uri"] as? String ?? ""
        let type = slave["type"] as? String ?? "subtitle"
        let selected = false

        let slaveType = type == "subtitle" ?
            .subtitle :
            .audio

        guard let url = URL(string: uri) else {
            let error = ["error": "Invalid URI, \(type) slave could not be added"]
            onError(error)
            continue
        }

        mediaPlayer?.addPlaybackSlave(url, type: slaveType, enforce: selected)
    }

    func addPlayerSlaves() {
        slaves?.filter { $0.getString("type") == "subtitle" }.forEach(addPlayerSlave)
        slaves?.filter { $0.getString("type") == "audio" }.forEach(addPlayerSlave)
    }

    func setSlaves(_ slaves: [[String: Any]]?) {
        let old = self.slaves
        self.slaves = slaves

        if slaves != old {
            addPlayerSlaves()
        }
    }

    func setPlayerTracks() {
        guard let player = mediaPlayer else { return }

        let audioTrackIndex = tracks?["audio"] as? Int ?? player.currentAudioTrackIndex
        let videoTrackIndex = tracks?["video"] as? Int ?? player.currentVideoTrackIndex
        let videoSubTitleIndex = tracks?["subtitle"] as? Int ?? player.currentVideoSubTitleIndex

        player.currentAudioTrackIndex = Int32(audioTrackIndex)
        player.currentVideoTrackIndex = Int32(videoTrackIndex)
        player.currentVideoSubTitleIndex = Int32(videoSubTitleIndex)
    }

    func setTracks(_ tracks: [String: Any]?) {
        let old = self.tracks
        self.tracks = tracks

        if tracks != old {
            setPlayerTracks()
        }
    }

    func setVolume(_ volume: Int) {
        if options.hasAudioOption() {
            let error = ["error": "Audio disabled via options"]
            onError(error)
        }

        guard let player = mediaPlayer else { return }

        let newVolume = max(minPlayerVolume, min(maxPlayerVolume, volume))
        userVolume = newVolume

        player.audio?.volume = Int32(newVolume)
        MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setMute(_ mute: Bool) {
        if options.hasAudioOption() {
            let error = ["error": "Audio disabled via options"]
            onError(error)
        }

        guard let player = mediaPlayer else { return }

        let newVolume = !mute ?
            max(playerVolumeStep, min(maxPlayerVolume, userVolume)) :
            minPlayerVolume

        player.audio?.volume = Int32(newVolume)
        MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setRate(_ rate: Float) {
        guard let player = mediaPlayer else { return }

        player.rate = rate
    }

    func setTime(_ time: Int) {
        self.time = time
    }

    func setRepeat(_ shouldRepeat: Bool) {
        if options.hasRepeatOption() {
            let error = ["error": "Repeat enabled via options"]
            onError(error)
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
        MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setPlayInBackground(_ playInBackground: Bool) {
        self.playInBackground = playInBackground
        MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
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
        MediaPlayerManager.shared.unregisterView(view: self)
    }
}

extension Array where Element == String {
    func hasAudioOption() -> Bool {
        let options: Set<String> = [
            "--no-audio", "-no-audio", ":no-audio",
        ]

        return contains { arg in options.contains(arg) }
    }
}

extension Array where Element == String {
    func hasRepeatOption() -> Bool {
        let options: Set<String> = [
            "--input-repeat=", "-input-repeat=", ":input-repeat=",
        ]

        return contains { arg in
            options.contains { option in
                arg.hasPrefix(option)
            }
        }
    }
}
