import ExpoModulesCore
import UIKit
#if os(tvOS)
    import TVVLCKit
#else
    import MobileVLCKit
#endif

private let dialogCustomUI: Bool = true

private let maxRetryCount: Int = 5

class LibVlcPlayerView: ExpoView {
    private let playerView = UIView()

    var mediaPlayer: VLCMediaPlayer?
    var vlcDialog: VLCDialogProvider?
    var vlcDialogRef: NSValue?

    var oldVolume: Int = MediaPlayerConstants.maxPlayerVolume

    var firstPlay: Bool = true
    private var shouldInit: Bool = true

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

        playerView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        playerView.backgroundColor = .black
        clipsToBounds = true

        MediaPlayerManager.shared.registerPlayerView(self)
        addSubview(playerView)
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

    func initPlayer() {
        if shouldInit {
            destroyPlayer()

            if source != nil {
                createPlayer()
            }
        }
    }

    func createPlayer() {
        mediaPlayer = VLCMediaPlayer(options: options)
        mediaPlayer!.drawable = playerView
        mediaPlayer!.delegate = self

        let library = mediaPlayer!.libraryInstance
        vlcDialog = VLCDialogProvider(library: library, customUI: dialogCustomUI)
        vlcDialog!.customRenderer = self

        guard let url = URL(string: source!) else {
            onEncounteredError(["error": "Invalid source, media could not be set"])
            return
        }

        mediaPlayer!.media = VLCMedia(url: url)

        if autoplay {
            mediaPlayer!.play()
        }

        firstPlay = true
        shouldInit = false
    }

    func destroyPlayer() {
        mediaPlayer?.drawable = nil
        mediaPlayer?.delegate = nil
        mediaPlayer?.media = nil
        mediaPlayer = nil
        vlcDialog?.customRenderer = nil
        vlcDialog = nil
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
        DispatchQueue.main.async { [self] in
            let view = playerView
            var transform: CGAffineTransform = .identity

            if let player = mediaPlayer {
                let video = player.videoSize

                if hasVideoSize() {
                    let viewAspect = view.frame.size.width / view.frame.size.height
                    let videoAspect = video.width / video.height

                    switch contentFit {
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

            view.transform = transform
        }
    }

    func setupPlayer() {
        if let player = mediaPlayer {
            setPlayerTracks()

            addPlayerSlaves()

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

    func getMediaLength() -> Int32 {
        var length: Int32 = 0

        if let player = mediaPlayer, let media = player.media {
            let duration = media.length.intValue

            if duration > 0 {
                length = duration
            }
        }

        return length
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
            let length = getMediaLength()
            let seekable = player.isSeekable

            mediaInfo = MediaInfo(
                width: Int(video.width),
                height: Int(video.height),
                length: Double(length),
                seekable: seekable,
            )
        }

        return mediaInfo
    }

    func hasAudioVideo() -> Bool {
        let tracks = getMediaTracks()
        let length = getMediaLength()

        let hasAudio = tracks.audio.contains { track in track.id != -1 }
        let hasVideo = tracks.video.contains { track in track.id != -1 }

        let hasAudioOnly = hasAudio && !hasVideo && length > 0
        let hasAudioAndVideo = hasAudio && hasVideo && hasVideoSize() && length > 0

        return hasAudioOnly || hasAudioAndVideo
    }

    func hasVideoSize() -> Bool {
        if let video = mediaPlayer?.videoSize {
            video.width > 0 && video.height > 0
        } else {
            false
        }
    }

    var source: String? {
        didSet {
            shouldInit = true
        }
    }

    var options: [String] = .init() {
        didSet {
            shouldInit = true
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

    var shouldRepeat: Bool = false

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
                    time = Int(value * Double(getMediaLength()))
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

            if hasVideoSize() {
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

    func retryUntil(
        maxRetries: Int = maxRetryCount,
        retry: Int = 0,
        delay: Int = 100,
        block: @escaping () -> Bool
    ) {
        if block() || retry >= maxRetries { return }

        let expDelay = Double(delay) * 1.5

        DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(delay)) { [weak self] in
            self?.retryUntil(
                maxRetries: maxRetries,
                retry: retry + 1,
                delay: Int(expDelay),
                block: block
            )
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
                    retryUntil { [self] in
                        onFirstPlay(getMediaInfo())
                        return hasAudioVideo()
                    }

                    retryUntil { [self] in
                        setContentFit()
                        return hasVideoSize()
                    }

                    setupPlayer()

                    firstPlay = false
                }

                MediaPlayerManager.shared.keepAwakeManager.toggleKeepAwake()

                retryUntil {
                    let volume = player.audio?.volume ?? Int32(MediaPlayerConstants.minPlayerVolume)
                    let hasVolume = volume > MediaPlayerConstants.minPlayerVolume
                    MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
                    return hasVolume
                }
            case .paused:
                onPaused()

                MediaPlayerManager.shared.keepAwakeManager.toggleKeepAwake()
                MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
            case .stopped:
                onStopped()

                MediaPlayerManager.shared.keepAwakeManager.toggleKeepAwake()
                MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
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
