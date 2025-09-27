import ExpoModulesCore
import MobileVLCKit
import UIKit

let defaultPlayerRate: Float = 1.0
let defaultPlayerTime: Int = 0
let defaultPlayerScale: Float = 0.0

let minPlayerVolume: Int = 0
let maxPlayerVolume: Int = 100
let playerVolumeStep: Int = 10

let dialogCustomUI: Bool = true

class LibVlcPlayerView: ExpoView {
    private let playerView = UIView()

    var mediaPlayer: VLCMediaPlayer?
    var vlcDialog: VLCDialogProvider?
    var vlcDialogRef: NSValue?

    var mediaLength: Int32 = 0
    private var oldVolume: Int = maxPlayerVolume

    private var shouldCreate: Bool = false
    var firstPlay: Bool = false

    let onBuffering = EventDispatcher()
    let onPlaying = EventDispatcher()
    let onPaused = EventDispatcher()
    let onStopped = EventDispatcher()
    let onEndReached = EventDispatcher()
    let onEncounteredError = EventDispatcher()
    let onTimeChanged = EventDispatcher()
    let onPositionChanged = EventDispatcher()
    let onESAdded = EventDispatcher()
    let onDialogDisplay = EventDispatcher()
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

        guard let source = source else { return }

        if autoplay {
            options.removeStartPausedOption()
        }

        mediaPlayer = VLCMediaPlayer(options: options)
        mediaPlayer!.drawable = playerView
        mediaPlayer!.delegate = self

        let library = mediaPlayer!.libraryInstance
        vlcDialog = VLCDialogProvider(library: library, customUI: dialogCustomUI)
        vlcDialog!.customRenderer = self

        guard let url = URL(string: source) else {
            let error = ["error": "Invalid source, media could not be set"]
            onEncounteredError(error)
            return
        }

        mediaPlayer!.media = VLCMedia(url: url)

        addPlayerSlaves()

        mediaPlayer!.play()

        firstPlay = true
        shouldCreate = false
    }

    func destroyPlayer() {
        vlcDialogRef = nil
        vlcDialog = nil
        mediaPlayer?.media = nil
        mediaPlayer?.delegate = nil
        mediaPlayer?.drawable = nil
        mediaPlayer = nil
    }

    func setPlayerTracks() {
        if let player = mediaPlayer {
            let audioTrackIndex = tracks?.audio ?? Int(player.currentAudioTrackIndex)
            let videoTrackIndex = tracks?.video ?? Int(player.currentVideoTrackIndex)
            let videoSubTitleIndex = tracks?.subtitle ?? Int(player.currentVideoSubTitleIndex)

            player.currentAudioTrackIndex = Int32(audioTrackIndex)
            player.currentVideoTrackIndex = Int32(videoTrackIndex)
            player.currentVideoSubTitleIndex = Int32(videoSubTitleIndex)
        }
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
        if let player = mediaPlayer {
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
    }

    var source: String? {
        didSet {
            shouldCreate = source != oldValue
        }
    }

    var options: [String] = .init() {
        didSet {
            shouldCreate = options != oldValue
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
            let newSlaves = newValue.filter { slave in !_slaves.contains(slave) }

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
            if let aspectRatio = aspectRatio {
                aspectRatio.withCString { cString in
                    mediaPlayer?.videoAspectRatio = UnsafeMutablePointer(mutating: cString)
                }
            } else {
                mediaPlayer?.videoAspectRatio = nil
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

    var shouldRepeat: Bool = false {
        didSet {
            if options.hasRepeatOption() {
                let error = ["error": "Repeat enabled via options"]
                onEncounteredError(error)
            }
        }
    }

    var playInBackground: Bool = false {
        didSet {
            MediaPlayerManager.shared.setAppropriateAudioSession()
        }
    }

    var autoplay: Bool = true {
        didSet {
            if !autoplay {
                options.append("--start-paused")
            }
        }
    }

    func play() {
        if let player = mediaPlayer {
            if options.hasStartPausedOption() {
                player.play()
            }

            player.play()
        }
    }

    func pause() {
        mediaPlayer?.pause()
    }

    func stop() {
        mediaPlayer?.stop()
    }

    func seek(_ value: Double, _ type: String) {
        if let player = mediaPlayer {
            if player.isSeekable {
                if type == "position" {
                    player.position = Float(value)
                } else {
                    player.time = VLCTime(int: Int32(value))
                }
            } else {
                time = Int(value * Double(mediaLength))
            }
        }
    }

    func postAction(_ action: Int) {
        if let dialog = vlcDialog, let reference = vlcDialogRef {
            dialog.postAction(Int32(action), forDialogReference: reference)
            vlcDialogRef = nil
        }
    }

    func dismiss() {
        if let dialog = vlcDialog, let reference = vlcDialogRef {
            dialog.dismissDialog(withReference: reference)
            vlcDialogRef = nil
        }
    }
}

private extension Array where Element == String {
    func hasAudioOption() -> Bool {
        let options = [
            "--no-audio",
            "-no-audio",
            ":no-audio",
        ]

        return contains { option in options.contains(option) }
    }
}

extension Array where Element == String {
    func hasRepeatOption() -> Bool {
        let options = [
            "--input-repeat=",
            "-input-repeat=",
            ":input-repeat=",
        ]

        return contains { option in
            options.contains { value in
                option.hasPrefix(value)
            }
        }
    }
}

extension Array where Element == String {
    func hasStartPausedOption() -> Bool {
        let options = [
            "--start-paused",
            "-start-paused",
            ":start-paused",
        ]

        return contains { option in options.contains(option) }
    }
}

extension Array where Element == String {
    mutating func removeStartPausedOption() {
        let options = [
            "--start-paused",
            "-start-paused",
            ":start-paused",
        ]

        removeAll { option in options.contains(option) }
    }
}
