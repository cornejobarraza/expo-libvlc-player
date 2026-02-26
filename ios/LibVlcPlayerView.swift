import ExpoModulesCore
#if os(tvOS)
    import TVVLCKit
#else
    import MobileVLCKit
#endif
import UIKit

private let dialogCustomUI: Bool = true

class LibVlcPlayerView: ExpoView {
    private let playerView = UIView()

    var mediaPlayer: VLCMediaPlayer?
    var vlcDialog: VLCDialogProvider?
    var vlcDialogRef: NSValue?

    var mediaLength: Int32?
    private var oldVolume: Int = MediaPlayerConstants.maxPlayerVolume

    private var shouldCreate: Bool = true
    var firstPlay: Bool = false
    var firstTime: Bool = false

    let onBuffering = EventDispatcher()
    let onPlaying = EventDispatcher()
    let onPaused = EventDispatcher()
    let onStopped = EventDispatcher()
    let onEndReached = EventDispatcher()
    let onEncounteredError = EventDispatcher()
    let onDialogDisplay = EventDispatcher()
    let onTimeChanged = EventDispatcher()
    let onPositionChanged = EventDispatcher()
    let onESAdded = EventDispatcher()
    let onRecordChanged = EventDispatcher()
    let onSnapshotTaken = EventDispatcher()
    let onFirstPlay = EventDispatcher()
    let onForeground = EventDispatcher()
    let onBackground = EventDispatcher()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        clipsToBounds = true
        playerView.backgroundColor = .black
        addSubview(playerView)

        MediaPlayerManager.shared.registerPlayerView(self)
    }

    deinit {
        MediaPlayerManager.shared.unregisterPlayerView(self)
        destroyPlayer()
    }

    override var bounds: CGRect {
        didSet {
            playerView.transform = .identity
            playerView.frame = bounds
            setContentFit()
        }
    }

    func createPlayer() {
        if !shouldCreate {
            return
        }

        destroyPlayer()

        guard let source else { return }

        var initOptions = options
        initOptions.toggleStartPausedOption(autoplay)

        mediaPlayer = VLCMediaPlayer(options: initOptions)
        mediaPlayer!.drawable = playerView
        mediaPlayer!.delegate = self

        let library = mediaPlayer!.libraryInstance
        vlcDialog = VLCDialogProvider(library: library, customUI: dialogCustomUI)
        vlcDialog!.customRenderer = self

        guard let url = URL(string: source) else {
            onEncounteredError(["error": "Invalid source, media could not be set"])
            return
        }

        mediaPlayer!.media = VLCMedia(url: url)
        addPlayerSlaves()
        mediaPlayer!.play()

        shouldCreate = false
        firstPlay = true
        firstTime = true
    }

    func destroyPlayer() {
        mediaPlayer?.drawable = nil
        mediaPlayer?.delegate = nil
        mediaPlayer?.media = nil
        mediaPlayer = nil
        vlcDialog?.customRenderer = nil
        vlcDialog = nil
        vlcDialogRef = nil
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
                onEncounteredError(["error": "Invalid slave, \(type) could not be added"])
                continue
            }

            mediaPlayer?.addPlaybackSlave(url, type: slaveType, enforce: selected)
        }
    }

    func setContentFit() {
        DispatchQueue.main.async {
            let view = self.playerView.frame.size

            var transform: CGAffineTransform = .identity

            if let player = self.mediaPlayer {
                let video = player.videoSize

                if video != .zero {
                    let viewAspect = view.width / view.height
                    let videoAspect = video.width / video.height

                    switch self.contentFit {
                    case .contain:
                        // No transform required
                        break
                    case .cover:
                        let scale = videoAspect > viewAspect ?
                            videoAspect / viewAspect :
                            viewAspect / videoAspect

                        transform = CGAffineTransform(scaleX: scale, y: scale)
                    case .fill:
                        var scaleX = 1.0
                        var scaleY = 1.0

                        if videoAspect > viewAspect {
                            scaleY = videoAspect / viewAspect
                        } else {
                            scaleX = viewAspect / videoAspect
                        }

                        transform = CGAffineTransform(scaleX: scaleX, y: scaleY)
                    }
                }
            }

            self.playerView.transform = transform
        }
    }

    func getMediaTracks() -> MediaTracks {
        var mediaTracks = MediaTracks()

        if let player = mediaPlayer {
            var audioTracks: [Track] = []

            if let audios = player.audioTrackNames as? [String] {
                if let audioIndexes = player.audioTrackIndexes as? [NSNumber] {
                    for (index, trackName) in zip(audioIndexes, audios) {
                        let track = Track(id: index.intValue, name: trackName)
                        audioTracks.append(track)
                    }
                }
            }

            var videoTracks: [Track] = []

            if let videos = player.videoTrackNames as? [String] {
                if let videoIndexes = player.videoTrackIndexes as? [NSNumber] {
                    for (index, trackName) in zip(videoIndexes, videos) {
                        let track = Track(id: index.intValue, name: trackName)
                        videoTracks.append(track)
                    }
                }
            }

            var subtitleTracks: [Track] = []

            if let subtitles = player.videoSubTitlesNames as? [String] {
                if let subtitleIndexes = player.videoSubTitlesIndexes as? [NSNumber] {
                    for (index, trackName) in zip(subtitleIndexes, subtitles) {
                        let track = Track(id: index.intValue, name: trackName)
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

            mediaLength = length > 0 ?
                length :
                nil
        }

        return mediaInfo
    }

    func setupPlayer() {
        if let player = mediaPlayer {
            setPlayerTracks()

            if scale != MediaPlayerConstants.defaultPlayerScale {
                player.scaleFactor = scale
            }

            if rate != MediaPlayerConstants.defaultPlayerRate {
                player.rate = rate
            }

            if time != MediaPlayerConstants.defaultPlayerTime {
                player.time = VLCTime(int: Int32(time))
            }

            if volume != MediaPlayerConstants.maxPlayerVolume || mute {
                let newVolume = mute ?
                    MediaPlayerConstants.minPlayerVolume :
                    volume

                player.audio?.volume = Int32(newVolume)
            }

            time = MediaPlayerConstants.defaultPlayerTime
        }
    }

    var source: String? {
        didSet {
            shouldCreate = true
        }
    }

    var options: [String] = .init() {
        didSet {
            shouldCreate = true
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

    var scale: Float = MediaPlayerConstants.defaultPlayerScale {
        didSet {
            mediaPlayer?.scaleFactor = scale
        }
    }

    var contentFit: VideoContentFit = .contain {
        didSet {
            setContentFit()
        }
    }

    var rate: Float = MediaPlayerConstants.defaultPlayerRate {
        didSet {
            mediaPlayer?.rate = rate
        }
    }

    var time: Int = MediaPlayerConstants.defaultPlayerTime

    var volume: Int = MediaPlayerConstants.maxPlayerVolume {
        didSet {
            let newVolume = max(MediaPlayerConstants.minPlayerVolume, min(MediaPlayerConstants.maxPlayerVolume, volume))
            oldVolume = newVolume

            if !mute {
                mediaPlayer?.audio?.volume = Int32(newVolume)
                MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
            }
        }
    }

    var mute: Bool = false {
        didSet {
            let newVolume = mute ?
                MediaPlayerConstants.minPlayerVolume :
                oldVolume

            mediaPlayer?.audio?.volume = Int32(newVolume)
            MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
        }
    }

    var audioMixingMode: AudioMixingMode = .auto {
        didSet {
            MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
        }
    }

    var playInBackground: Bool = false

    var shouldRepeat: Bool = false

    var autoplay: Bool = true

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
                if type == "position" {
                    let length = mediaLength ?? 0
                    time = Int(value * Double(length))
                } else {
                    time = Int(value)
                }
            }
        }
    }

    func record(_ path: String?) {
        if let player = mediaPlayer {
            if let path {
                // https://code.videolan.org/videolan/VLCKit/-/issues/394
                let success = !player.startRecording(atPath: path)

                if !success {
                    onEncounteredError(["error": "Media could not be recorded"])

                    player.stopRecording()
                }
            } else {
                player.stopRecording()
            }
        }
    }

    func snapshot(_ path: String) {
        if let player = mediaPlayer {
            let video = player.videoSize

            if video != .zero {
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd-HH'h'mm'm'ss's'"
                let snapshotPath = path + "/vlc-snapshot-\(dateFormatter.string(from: Date())).jpg"

                player.saveVideoSnapshot(at: snapshotPath, withWidth: Int32(video.width), andHeight: Int32(video.height))

                onSnapshotTaken(["path": snapshotPath])
            } else {
                onEncounteredError(["error": "Snapshot could not be taken"])
                return
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

extension LibVlcPlayerView: VLCMediaPlayerDelegate {
    func mediaPlayerStateChanged(_: Notification) {
        if let player = mediaPlayer {
            switch player.state {
            case .buffering:
                onBuffering()
            case .playing:
                onPlaying()

                if firstPlay {
                    setupPlayer()

                    onFirstPlay(getMediaInfo())

                    firstPlay = false
                }

                MediaPlayerManager.shared.keepAwakeManager.activateKeepAwake()
                MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
            case .paused:
                onPaused()

                MediaPlayerManager.shared.keepAwakeManager.deactivateKeepAwake()
                MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
            case .stopped:
                onStopped()

                MediaPlayerManager.shared.keepAwakeManager.deactivateKeepAwake()
                MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()

                firstPlay = true
                firstTime = true
            case .ended:
                onEndReached()

                player.stop()

                if shouldRepeat {
                    player.play()
                }
            case .error:
                onEncounteredError(["error": "Player encountered an error"])

                player.stop()
            case .esAdded:
                onESAdded(getMediaTracks())
            default:
                break
            }
        }
    }

    func mediaPlayerTimeChanged(_: Notification) {
        if let player = mediaPlayer {
            onTimeChanged(["time": player.time.intValue])

            if firstTime {
                if mediaLength == nil {
                    onFirstPlay(getMediaInfo())
                }

                setContentFit()

                MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()

                firstTime = false
            }

            onPositionChanged(["position": player.position])
        }
    }

    func mediaPlayerStartedRecording(_: VLCMediaPlayer) {
        let recording = Recording(
            path: nil,
            isRecording: true,
        )

        onRecordChanged(recording)
    }

    func mediaPlayer(_: VLCMediaPlayer, recordingStoppedAtPath path: String) {
        let recording = Recording(
            path: path,
            isRecording: false,
        )

        onRecordChanged(recording)
    }
}

extension LibVlcPlayerView: VLCCustomDialogRendererProtocol {
    func showError(
        withTitle title: String,
        message: String
    ) {
        let dialog = Dialog(
            title: title,
            text: message,
        )

        onDialogDisplay(dialog)
    }

    func showLogin(
        withTitle title: String,
        message: String,
        defaultUsername _: String?,
        askingForStorage _: Bool,
        withReference reference: NSValue
    ) {
        vlcDialogRef = reference

        let dialog = Dialog(
            title: title,
            text: message,
        )

        onDialogDisplay(dialog)
    }

    func showQuestion(
        withTitle title: String,
        message: String,
        type _: VLCDialogQuestionType,
        cancel: String?,
        action1String: String?,
        action2String: String?,
        withReference reference: NSValue
    ) {
        vlcDialogRef = reference

        let dialog = Dialog(
            title: title,
            text: message,
            cancelText: cancel,
            action1Text: action1String,
            action2Text: action2String
        )

        onDialogDisplay(dialog)
    }

    func showProgress(
        withTitle _: String,
        message _: String,
        isIndeterminate _: Bool,
        position _: Float,
        cancel _: String?,
        withReference _: NSValue
    ) {}

    func updateProgress(
        withReference _: NSValue,
        message _: String?,
        position _: Float
    ) {}

    func cancelDialog(withReference _: NSValue) {}
}

private extension [String] {
    func hasStartPausedOption() -> Bool {
        let options = [
            "--start-paused",
            "-start-paused",
            ":start-paused",
        ]

        return contains { option in options.contains(option) }
    }
}

private extension [String] {
    mutating func toggleStartPausedOption(_ autoplay: Bool) {
        let options = [
            "--start-paused",
            "-start-paused",
            ":start-paused",
        ]

        removeAll { option in options.contains(option) }

        if !autoplay {
            append("--start-paused")
        }
    }
}
