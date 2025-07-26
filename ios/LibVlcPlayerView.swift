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

        MediaPlayerManager.shared.registerPlayerView(view: self)

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

        guard let url = URL(string: source) else {
            let error = ["error": "Invalid source, media could not be set"]
            onEncounteredError(error)
            return
        }

        mediaPlayer!.media = VLCMedia(url: url)
        mediaPlayer!.media!.delegate = self

        addPlayerSlaves()

        if volume != maxPlayerVolume {
            mediaPlayer!.audio?.volume = Int32(volume)
        }

        if mute {
            mediaPlayer!.audio?.volume = Int32(minPlayerVolume)
        }

        if rate != defaultPlayerRate {
            mediaPlayer!.rate = rate
        }

        if let aspectRatio = aspectRatio {
            aspectRatio.withCString { cString in
                mediaPlayer!.videoAspectRatio = UnsafeMutablePointer(mutating: cString)
            }
        }

        if autoplay {
            mediaPlayer!.play()
        }

        shouldCreate = false
    }

    func destroyPlayer() {
        mediaPlayer?.media = nil
        mediaPlayer = nil
    }

    var source: String? {
        didSet {
            if source != nil {
                shouldCreate = source != oldValue
            } else {
                destroyPlayer()
            }
        }
    }

    var options: [String] = .init() {
        didSet {
            if source != nil {
                shouldCreate = options != oldValue
            } else {
                destroyPlayer()
            }
        }
    }

    func addPlayerSlave(_ slave: [String: Any]) {
        let source = slave["source"] as? String ?? ""
        let type = slave["type"] as? String ?? "item"
        let selected = false

        let slaveType = type == "subtitle" ?
            VLCMediaPlaybackSlaveType.subtitle :
            VLCMediaPlaybackSlaveType.audio

        guard let url = URL(string: source) else {
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

    var slaves: [[String: Any]]? {
        didSet {
            addPlayerSlaves()
        }
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

    var tracks: [String: Any]? {
        didSet {
            if options.hasAudioTrackOption() {
                let error = ["error": "Audio track selected via options"]
                onEncounteredError(error)
            }

            if options.hasSubtitleTrackOption() {
                let error = ["error": "Subtitle track selected via options"]
                onEncounteredError(error)
            }

            setPlayerTracks()
        }
    }

    var volume: Int = maxPlayerVolume {
        didSet {
            if options.hasAudioOption() {
                let error = ["error": "Audio disabled via options"]
                onEncounteredError(error)
            }

            let newVolume = max(minPlayerVolume, min(maxPlayerVolume, volume))
            userVolume = newVolume

            mediaPlayer?.audio?.volume = Int32(newVolume)
            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        }
    }

    var mute: Bool = false {
        didSet {
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
    }

    var rate: Float = defaultPlayerRate {
        didSet {
            mediaPlayer?.rate = rate
        }
    }

    var time: Int = defaultPlayerTime

    var shouldRepeat: Bool = false {
        didSet {
            if options.hasRepeatOption() {
                let error = ["error": "Repeat enabled via options"]
                onEncounteredError(error)
            }
        }
    }

    var aspectRatio: String? {
        didSet {
            guard let aspectRatio = aspectRatio else { return }

            aspectRatio.withCString { cString in
                mediaPlayer?.videoAspectRatio = UnsafeMutablePointer(mutating: cString)
            }
        }
    }

    var audioMixingMode: AudioMixingMode = .auto {
        didSet {
            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        }
    }

    var playInBackground: Bool = false {
        didSet {
            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        }
    }

    var autoplay: Bool = true

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
        MediaPlayerManager.shared.unregisterPlayerView(view: self)
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
