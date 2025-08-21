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
    private var oldVolume: Int = maxPlayerVolume
    var firstPlay: Bool = false

    let onBuffering = EventDispatcher()
    let onPlaying = EventDispatcher()
    let onPaused = EventDispatcher()
    let onStopped = EventDispatcher()
    let onEndReached = EventDispatcher()
    let onEncounteredError = EventDispatcher()
    let onPositionChanged = EventDispatcher()
    let onESAdded = EventDispatcher()
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
        destroyPlayer()
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

    func destroyPlayer() {
        mediaPlayer?.media = nil
        mediaPlayer = nil
    }

    func getMediaTracks() -> MediaTracks {
        var mediaTracks = MediaTracks()

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

            mediaTracks = MediaTracks(
                audio: audioTracks,
                video: videoTracks,
                subtitle: subtitleTracks
            )
        }

        return mediaTracks
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

    func addPlayerSlaves() {
        for slave in slaves {
            let source = slave.source
            let type = slave.type
            let slaveType = type == "subtitle" ?
                VLCMediaPlaybackSlaveType.subtitle :
                VLCMediaPlaybackSlaveType.audio
            let selected = slave.selected ?? false

            guard let url = URL(string: source) else {
                let error = ["error": "Invalid slave, \(type) could not be added"]
                onEncounteredError(error)
                continue
            }

            mediaPlayer?.addPlaybackSlave(url, type: slaveType, enforce: selected)
        }
    }

    func getMediaInfo() -> MediaInfo {
        var mediaInfo = MediaInfo()

        if let player = mediaPlayer {
            let video = player.videoSize
            let length = player.media?.length.intValue ?? 0
            let seekable = player.isSeekable
            let mediaTracks = getMediaTracks()

            mediaInfo = MediaInfo(
                width: Int(video.width),
                height: Int(video.height),
                length: Double(length),
                seekable: seekable,
                tracks: mediaTracks,
            )

            mediaLength = length
        }

        return mediaInfo
    }

    func setupPlayer() {
        guard let player = mediaPlayer else { return }

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
            }
        }
    }

    var tracks: Tracks? {
        didSet {
            setPlayerTracks()
        }
    }

    private var _slaves: [Slave] = .init()

    var slaves: [Slave] {
        get { _slaves }
        set {
            let newSlaves = newValue.filter { !_slaves.contains($0) }

            _slaves += newSlaves

            if !newSlaves.isEmpty {
                addPlayerSlaves()
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

    var rate: Float = defaultPlayerRate {
        didSet {
            mediaPlayer?.rate = rate
        }
    }

    var time: Int = defaultPlayerTime

    var volume: Int = maxPlayerVolume {
        didSet {
            if options.hasAudioOption() {
                let error = ["error": "Audio disabled via options"]
                onEncounteredError(error)
            }

            let newVolume = max(minPlayerVolume, min(maxPlayerVolume, volume))
            oldVolume = newVolume

            if let player = mediaPlayer, let audio = player.audio {
                if audio.volume > minPlayerVolume {
                    audio.volume = Int32(newVolume)
                }
            }
        }
    }

    var mute: Bool = false {
        didSet {
            if options.hasAudioOption(), !mute {
                let error = ["error": "Audio disabled via options"]
                onEncounteredError(error)
            }

            let newVolume = mute ?
                minPlayerVolume :
                oldVolume

            mediaPlayer?.audio?.volume = Int32(newVolume)
            MediaPlayerManager.shared.setAppropriateAudioSession()
        }
    }

    var audioMixingMode: AudioMixingMode = .auto {
        didSet {
            MediaPlayerManager.shared.setAppropriateAudioSession()
        }
    }

    var playInBackground: Bool = false {
        didSet {
            MediaPlayerManager.shared.setAppropriateAudioSession()
        }
    }

    var autoplay: Bool = true

    var shouldRepeat: Bool = false {
        didSet {
            if options.hasRepeatOption() {
                let error = ["error": "Repeat enabled via options"]
                onEncounteredError(error)
            }
        }
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
