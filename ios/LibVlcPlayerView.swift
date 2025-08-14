import ExpoModulesCore
import MobileVLCKit
import UIKit

let defaultPlayerRate: Float = 1.0
let defaultPlayerTime: Int = 0
let defaultPlayerScale: Float = 0.0

let minPlayerVolume: Int = 0
let maxPlayerVolume: Int = 100
let playerVolumeStep: Int = 10

class LibVlcPlayerView: ExpoView {
    private let playerView = UIView()

    var mediaPlayer: VLCMediaPlayer?
    private var shouldCreate: Bool = false

    var mediaLength: Int32 = 0
    private var userVolume: Int = maxPlayerVolume
    var firstPlay: Bool = true

    let onBuffering = EventDispatcher()
    let onPlaying = EventDispatcher()
    let onPaused = EventDispatcher()
    let onStopped = EventDispatcher()
    let onEndReached = EventDispatcher()
    let onEncounteredError = EventDispatcher()
    let onPositionChanged = EventDispatcher()
    let onFirstPlay = EventDispatcher()
    let onBackground = EventDispatcher()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        MediaPlayerManager.shared.registerPlayerView(self)

        clipsToBounds = true
        playerView.backgroundColor = .black
        addSubview(playerView)
    }

    deinit {
        MediaPlayerManager.shared.unregisterPlayerView(self)
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

        guard let source = source, let url = URL(string: source) else {
            let error = ["error": "Invalid source, media could not be set"]
            onEncounteredError(error)
            return
        }

        mediaPlayer!.media = VLCMedia(url: url)

        addPlayerSlaves()

        if autoplay {
            mediaPlayer!.play()
        }

        shouldCreate = false
        firstPlay = true
    }

    func setupMediaInfo() {
        var mediaInfo = MediaInfo()

        if let player = mediaPlayer {
            var audioTracks: [Track] = []

            if let audios = player.audioTrackNames as? [String] {
                if let audioIndexes = player.audioTrackIndexes as? [NSNumber] {
                    for (index, trackName) in audios.enumerated() {
                        let trackId = audioIndexes[index].intValue
                        let track = Track(id: trackId, name: trackName)
                        audioTracks.append(track)
                    }
                }
            }

            var videoTracks: [Track] = []

            if let videos = player.videoTrackNames as? [String] {
                if let videoIndexes = player.videoTrackIndexes as? [NSNumber] {
                    for (index, trackName) in videos.enumerated() {
                        let trackId = videoIndexes[index].intValue
                        let track = Track(id: trackId, name: trackName)
                        videoTracks.append(track)
                    }
                }
            }

            var subtitleTracks: [Track] = []

            if let subtitles = player.videoSubTitlesNames as? [String] {
                if let subtitleIndexes = player.videoSubTitlesIndexes as? [NSNumber] {
                    for (index, trackName) in subtitles.enumerated() {
                        let trackId = subtitleIndexes[index].intValue
                        let track = Track(id: trackId, name: trackName)
                        subtitleTracks.append(track)
                    }
                }
            }

            let video = player.videoSize
            let tracks = MediaTracks(
                audio: audioTracks,
                video: videoTracks,
                subtitle: subtitleTracks
            )
            let length = player.media?.length.intValue ?? 0
            let seekable = player.isSeekable

            mediaInfo = MediaInfo(
                width: Int(video.width),
                height: Int(video.height),
                tracks: tracks,
                duration: Double(length),
                seekable: seekable
            )

            mediaLength = length
        }

        onFirstPlay(mediaInfo)
    }

    func setupPlayer() {
        guard let player = mediaPlayer else { return }

        setupMediaInfo()
        setPlayerTracks()

        if volume != maxPlayerVolume || mute {
            let newVolume = mute ?
                minPlayerVolume :
                volume

            player.audio?.volume = Int32(newVolume)
        }

        if rate != defaultPlayerRate {
            player.rate = rate
        }

        if time != defaultPlayerTime {
            player.time = VLCTime(int: Int32(time))
        }

        if scale != defaultPlayerScale {
            player.scaleFactor = scale
        }

        if let aspectRatio = aspectRatio {
            aspectRatio.withCString { cString in
                player.videoAspectRatio = UnsafeMutablePointer(mutating: cString)
            }
        }

        time = defaultPlayerTime
        firstPlay = false
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

    func addPlayerSlave(_ slave: Slave) {
        let source = slave.source
        let type = slave.type
        let slaveType = type == "subtitle" ?
            VLCMediaPlaybackSlaveType.subtitle :
            VLCMediaPlaybackSlaveType.audio
        let selected = false

        guard let url = URL(string: source) else {
            let error = ["error": "Invalid slave, \(type) could not be added"]
            onEncounteredError(error)
            return
        }

        mediaPlayer?.addPlaybackSlave(url, type: slaveType, enforce: selected)
    }

    func addPlayerSlaves() {
        // Add in this specific order, otherwise subtitle slaves will be missing
        slaves?.filter { $0.type == "subtitle" }.forEach { addPlayerSlave($0) }
        slaves?.filter { $0.type == "audio" }.forEach { addPlayerSlave($0) }
    }

    var slaves: [Slave]? {
        didSet {
            addPlayerSlaves()
        }
    }

    func setPlayerTracks() {
        guard let player = mediaPlayer else { return }

        let audioTrackIndex = tracks?.audio ?? Int(player.currentAudioTrackIndex)
        let videoTrackIndex = tracks?.video ?? Int(player.currentVideoTrackIndex)
        let videoSubTitleIndex = tracks?.subtitle ?? Int(player.currentVideoSubTitleIndex)

        player.currentAudioTrackIndex = Int32(audioTrackIndex)
        player.currentVideoTrackIndex = Int32(videoTrackIndex)
        player.currentVideoSubTitleIndex = Int32(videoSubTitleIndex)
    }

    var tracks: Tracks? {
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

    var scale: Float = defaultPlayerScale {
        didSet {
            mediaPlayer?.scaleFactor = scale
        }
    }

    var aspectRatio: String? {
        didSet {
            guard let aspectRatio = aspectRatio else {
                mediaPlayer?.videoAspectRatio = nil
                return
            }

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
            let time = position * Float(mediaLength)
            self.time = Int(time)
        }
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
