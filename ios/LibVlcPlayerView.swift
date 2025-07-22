import ExpoModulesCore
import MobileVLCKit
import UIKit

let defaultPlayerRate: Float = 1.0
let defaultPlayerTime: Int = 0
let minPlayerVolume: Int = 0
let maxPlayerVolume: Int = 100
let playerVolumeStep: Int = 10

class LibVlcPlayerView: ExpoView {
    private let playerView = UIView()

    var mediaPlayer: VLCMediaPlayer?

    private var shouldCreate: Bool = false

    private var uri: String = ""
    var options: [String] = .init()
    private var slaves: [[String: Any]]?
    private var tracks: [String: Any]?
    var time: Int = defaultPlayerTime
    var shouldRepeat: Bool = false
    var audioMixingMode: AudioMixingMode = .auto
    var playInBackground: Bool = false
    private var autoplay: Bool = true

    var videoLength: Int32 = 0
    private var userVolume: Int = maxPlayerVolume

    let onBuffering = EventDispatcher()
    let onPlaying = EventDispatcher()
    let onPaused = EventDispatcher()
    let onStopped = EventDispatcher()
    let onEndReached = EventDispatcher()
    let onEncounteredError = EventDispatcher()
    let onPositionChanged = EventDispatcher()
    let onParsedChanged = EventDispatcher()
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

    func createPlayer() {
        if !shouldCreate {
            return
        }

        destroyPlayer()
        mediaPlayer = VLCMediaPlayer(options: options)
        mediaPlayer!.drawable = playerView
        mediaPlayer!.delegate = self

        guard let url = URL(string: uri) else {
            let error = ["error": "Invalid URI, media could not be set"]
            onEncounteredError(error)
            return
        }

        mediaPlayer!.media = VLCMedia(url: url)
        mediaPlayer!.media!.delegate = self

        addPlayerSlaves()

        if autoplay {
            mediaPlayer!.play()
        }

        shouldCreate = false
    }

    func destroyPlayer() {
        mediaPlayer?.media = nil
        mediaPlayer?.stop()
        mediaPlayer = nil
    }

    func setUri(_ uri: String) {
        let old = self.uri
        self.uri = uri

        shouldCreate = uri != old
    }

    func setOptions(_ options: [String]) {
        let old = self.options
        self.options = options

        shouldCreate = options != old
    }

    func addPlayerSlave(_ slave: [String: Any]) {
        let uri = slave["uri"] as? String ?? ""
        let type = slave["type"] as? String ?? "item"
        let selected = false

        let slaveType = type == "subtitle" ?
            VLCMediaPlaybackSlaveType.subtitle :
            VLCMediaPlaybackSlaveType.audio

        guard let url = URL(string: uri) else {
            let error = ["error": "Invalid slave, \(type) could not be added"]
            onEncounteredError(error)
            return
        }

        mediaPlayer?.addPlaybackSlave(url, type: slaveType, enforce: selected)
    }

    func addPlayerSlaves() {
        // Add in this specific order, otherwise subtitle slaves will be missing
        slaves?.filter { ($0["type"] as? String) == "subtitle" }.forEach { addPlayerSlave($0) }
        slaves?.filter { ($0["type"] as? String) == "audio" }.forEach { addPlayerSlave($0) }
    }

    func setSlaves(_ slaves: [[String: Any]]?) {
        self.slaves = slaves
        addPlayerSlaves()
    }

    func setPlayerTracks() {
        guard let player = mediaPlayer else { return }

        let audioTrackIndex = tracks?["audio"] as? Int ?? Int(player.currentAudioTrackIndex)
        let videoTrackIndex = tracks?["video"] as? Int ?? Int(player.currentVideoTrackIndex)
        let videoSubTitleIndex = tracks?["subtitle"] as? Int ?? Int(player.currentVideoSubTitleIndex)

        player.currentAudioTrackIndex = Int32(audioTrackIndex)
        player.currentVideoTrackIndex = Int32(videoTrackIndex)
        player.currentVideoSubTitleIndex = Int32(videoSubTitleIndex)
    }

    func setTracks(_ tracks: [String: Any]?) {
        if options.hasAudioTrackOption() {
            let error = ["error": "Audio track selected via options"]
            onEncounteredError(error)
        }

        if options.hasSubtitleTrackOption() {
            let error = ["error": "Subtitle track selected via options"]
            onEncounteredError(error)
        }

        self.tracks = tracks
        setPlayerTracks()
    }

    func setVolume(_ volume: Int) {
        if options.hasAudioOption() {
            let error = ["error": "Audio disabled via options"]
            onEncounteredError(error)
        }

        let newVolume = max(minPlayerVolume, min(maxPlayerVolume, volume))
        userVolume = newVolume

        mediaPlayer?.audio?.volume = Int32(newVolume)
        MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setMute(_ mute: Bool) {
        if options.hasAudioOption() {
            let error = ["error": "Audio disabled via options"]
            onEncounteredError(error)
        }

        let newVolume = !mute ?
            max(playerVolumeStep, min(maxPlayerVolume, userVolume)) :
            minPlayerVolume

        mediaPlayer?.audio?.volume = Int32(newVolume)
        MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setRate(_ rate: Float) {
        mediaPlayer?.rate = rate
    }

    func setTime(_ time: Int) {
        self.time = time
    }

    func setRepeat(_ shouldRepeat: Bool) {
        if options.hasRepeatOption() {
            let error = ["error": "Repeat enabled via options"]
            onEncounteredError(error)
        }

        self.shouldRepeat = shouldRepeat
    }

    func setAspectRatio(_ aspectRatio: String?) {
        guard let aspectRatio = aspectRatio else { return }

        aspectRatio.withCString { cString in
            mediaPlayer?.videoAspectRatio = UnsafeMutablePointer(mutating: cString)
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
            let time = position * Float(videoLength)
            player.time = VLCTime(int: Int32(time))
        }

        let userPosition = ["position": position]
        onPositionChanged(userPosition)
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
    func hasAudioTrackOption() -> Bool {
        let options: Set<String> = [
            "--audio-track=", "-audio-track=", ":audio-track=",
        ]

        return contains { arg in
            options.contains { option in
                arg.hasPrefix(option)
            }
        }
    }
}

extension Array where Element == String {
    func hasSubtitleTrackOption() -> Bool {
        let options: Set<String> = [
            "--sub-track=", "-sub-track=", ":sub-track=",
        ]

        return contains { arg in
            options.contains { option in
                arg.hasPrefix(option)
            }
        }
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
