import ExpoModulesCore
import UIKit
import VLCKit

private let dialogCustomUI: Bool = true

class LibVlcPlayerView: ExpoView {
    private let playerDrawable: MediaPlayerDrawable = .init()
    private var pictureDrawable: PictureInPictureDrawable!

    var library: VLCLibrary?
    var mediaPlayer: VLCMediaPlayer?
    var vlcDialog: VLCDialogProvider?
    var vlcDialogRef: NSValue?

    var oldVolume: Int = MediaPlayerConstants.maxPlayerVolume

    var firstPlay: Bool = true
    private var shouldInit: Bool = true
    var isInBackground: Bool = false

    let onBuffering = EventDispatcher()
    let onPlaying = EventDispatcher()
    let onPaused = EventDispatcher()
    let onStopped = EventDispatcher()
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
    let onPictureInPictureStart = EventDispatcher()
    let onPictureInPictureStop = EventDispatcher()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        pictureDrawable = PictureInPictureDrawable(self)
        clipsToBounds = true

        MediaPlayerManager.shared.registerExpoView(self)
    }

    deinit {
        MediaPlayerManager.shared.unregisterExpoView(self)
        destroyPlayer()
    }

    override var bounds: CGRect {
        didSet {
            playerDrawable.transform = .identity
            playerDrawable.frame = bounds
            setContentFit(drawable: playerDrawable)

            pictureDrawable.transform = .identity
            pictureDrawable.frame = bounds
            setContentFit(drawable: pictureDrawable)
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
        var drawable: MediaPlayerDrawable

        if pictureInPicture {
            playerDrawable.removeFromSuperview()
            drawable = pictureDrawable
        } else {
            pictureDrawable?.removeFromSuperview()
            drawable = playerDrawable
        }

        library = VLCLibrary()
        mediaPlayer = VLCMediaPlayer(library: library!)
        mediaPlayer!.drawable = drawable
        mediaPlayer!.delegate = self
        setupPlayer()

        vlcDialog = VLCDialogProvider(library: library!, customUI: dialogCustomUI)
        vlcDialog!.customRenderer = self

        guard let source, let url = URL(string: source) else {
            onEncounteredError(["message": "Invalid source, media could not be set"])
            return
        }

        var args = options
        args.normalizeOptions()
        args.toggleStartPausedOption(autoplay)

        let media = VLCMedia(url: url)
        args.forEach { arg in media!.addOption(arg) }
        mediaPlayer!.media = media
        mediaPlayer!.play()

        firstPlay = true
        shouldInit = false

        addSubview(drawable)
    }

    func destroyPlayer() {
        library = nil
        mediaPlayer?.stop()
        mediaPlayer = nil
        vlcDialog?.customRenderer = nil
        vlcDialog = nil
    }

    func selectTrack(_ index: Int, _ type: VLCMedia.TrackType) {
        if let player = mediaPlayer {
            if index == -1 {
                switch type {
                case .audio: player.deselectAllAudioTracks()
                case .video: player.deselectAllVideoTracks()
                case .text: player.deselectAllTextTracks()
                default: break
                }
            } else {
                player.selectTrack(at: index, type: type)
            }
        }
    }

    func setPlayerTracks() {
        let audioTrack = tracks?.audio
        let videoTrack = tracks?.video
        let textTrack = tracks?.subtitle

        if let audioTrack { selectTrack(audioTrack, .audio) }
        if let videoTrack { selectTrack(videoTrack, .video) }
        if let textTrack { selectTrack(textTrack, .text) }
    }

    func addPlayerSlaves(_ slaves: [Slave]) {
        for slave in slaves {
            let source = slave.source
            let type = slave.type
            let slaveType = type == "subtitle" ?
                VLCMediaPlaybackSlaveType.subtitle :
                VLCMediaPlaybackSlaveType.audio
            let selected = slave.selected ?? false

            guard let url = URL(string: source) else {
                onEncounteredError(["message": "Invalid source, \(type) could not be added"])
                continue
            }

            mediaPlayer?.addPlaybackSlave(url, type: slaveType, enforce: selected)
        }
    }

    func setContentFit(drawable: MediaPlayerDrawable) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            var transform: CGAffineTransform = .identity

            let video = getVideoSize()

            if hasVideoSize == true {
                let viewAspect = drawable.frame.size.width / drawable.frame.size.height
                let videoAspect = video.width / video.height

                switch contentFit {
                case .contain:
                    // No transformation required
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

            drawable.transform = transform
        }
    }

    func setupPlayer() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            if let player = mediaPlayer {
                addPlayerSlaves(slaves)

                if scale != MediaPlayerConstants.defaultPlayerScale {
                    player.scaleFactor = Float(scale)
                }

                if rate != MediaPlayerConstants.defaultPlayerRate {
                    player.rate = Float(rate)
                }

                if time != MediaPlayerConstants.defaultPlayerTime {
                    player.time = VLCTime(int: Int32(time))
                }

                if volume != MediaPlayerConstants.maxPlayerVolume || mute {
                    // Audio instance not ready, try again
                    retryUntil { [weak self] _ in
                        guard let self else { return true }

                        let newVolume = mute ?
                            MediaPlayerConstants.minPlayerVolume :
                            volume

                        player.audio?.volume = Int32(newVolume)

                        return false
                    }
                }

                time = MediaPlayerConstants.defaultPlayerTime
            }
        }
    }

    func getMediaTracks() -> MediaTracks {
        var mediaTracks = MediaTracks()

        if let player = mediaPlayer {
            let audioTracks: [Track] = player.audioTracks.map { audio in
                let id = (audio.trackId as NSString).intValue
                let name = audio.trackName
                return Track(id: Int(id), name: name)
            }

            let videoTracks: [Track] = player.videoTracks.map { video in
                let id = (video.trackId as NSString).intValue
                let name = video.trackName
                return Track(id: Int(id), name: name)
            }

            let subtitleTracks: [Track] = player.textTracks.map { subtitle in
                let id = (subtitle.trackId as NSString).intValue
                let name = subtitle.trackName
                return Track(id: Int(id), name: name)
            }

            mediaTracks = MediaTracks(
                audio: audioTracks,
                video: videoTracks,
                subtitle: subtitleTracks
            )
        }

        return mediaTracks
    }

    func getMediaLength() -> Int {
        var length = 0

        let duration = Int(mediaPlayer?.media?.length.intValue ?? 0)

        if duration > 0 {
            length = duration
        }

        return length
    }

    func getMediaInfo() -> MediaInfo {
        let video = getVideoSize()
        let length = getMediaLength()
        let seekable = mediaPlayer?.isSeekable ?? false

        return MediaInfo(
            width: Int(video.width),
            height: Int(video.height),
            length: length,
            seekable: seekable
        )
    }

    func getVideoSize() -> CGSize {
        if let size = mediaPlayer?.videoSize { return size }
        return CGSize(width: 0, height: 0)
    }

    var hasVideoSize: Bool {
        let video = getVideoSize()
        return video.width > 0 && video.height > 0
    }

    var hasVideoOut: Bool {
        let tracks = getMediaTracks()
        let length = getMediaLength()
        let hasVideo = tracks.video.count > 0
        return hasVideo && hasVideoSize && length > 0
    }

    var hasAudioOut: Bool {
        let tracks = getMediaTracks()
        let hasAudio = tracks.audio.count > 0
        let volume = mediaPlayer?.audio?.volume ?? Int32(MediaPlayerConstants.minPlayerVolume)
        return hasAudio && volume > MediaPlayerConstants.minPlayerVolume
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
                addPlayerSlaves(newSlaves)
            }
        }
    }

    var scale: Double = MediaPlayerConstants.defaultPlayerScale {
        didSet {
            mediaPlayer?.scaleFactor = Float(scale)
        }
    }

    var contentFit: VideoContentFit = .contain {
        didSet {
            setContentFit(drawable: playerDrawable)
            setContentFit(drawable: pictureDrawable)
        }
    }

    var rate: Double = MediaPlayerConstants.defaultPlayerRate {
        didSet {
            mediaPlayer?.rate = Float(rate)
        }
    }

    var time: Int = MediaPlayerConstants.defaultPlayerTime

    var volume: Int = MediaPlayerConstants.maxPlayerVolume {
        didSet {
            if mute { return }

            let newVolume = max(
                MediaPlayerConstants.minPlayerVolume,
                min(MediaPlayerConstants.maxPlayerVolume, volume)
            )
            mediaPlayer?.audio?.volume = Int32(newVolume)

            MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
        }
    }

    var mute: Bool = false {
        didSet {
            if mute {
                oldVolume = volume
            }

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

    var pictureInPicture: Bool = false {
        didSet {
            shouldInit = true
        }
    }

    func play() {
        if let player = mediaPlayer {
            if !autoplay {
                player.play()
            }

            player.play()
        }
    }

    func pause() {
        mediaPlayer?.pause()
    }

    func pauseIf(_ condition: Bool? = true) {
        if let player = mediaPlayer {
            let shouldPause = condition == true && player.isPlaying

            if shouldPause {
                player.pause()
            }
        }
    }

    func stop() {
        mediaPlayer?.stop()
    }

    func seek(_ value: Double, _ type: String? = "time") {
        if let player = mediaPlayer {
            if player.isSeekable {
                if type == "position" {
                    player.position = value
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
                player.startRecording(atPath: path)
            } else {
                player.stopRecording()
            }
        } else {
            onEncounteredError(["message": "Media could not be recorded"])
        }
    }

    func snapshot(_ path: String) {
        if hasVideoSize {
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd-HH'h'mm'm'ss's'"
            let timestamp = dateFormatter.string(from: Date())

            let snapshotPath = path + "/vlc-snapshot-\(timestamp).jpg"
            let video = CGSize(width: 0, height: 0) // Use original window size

            mediaPlayer?.saveVideoSnapshot(at: snapshotPath, withWidth: Int32(video.width), andHeight: Int32(video.height))

            let fileExists = FileManager.default.fileExists(atPath: snapshotPath)

            if fileExists {
                onSnapshotTaken(["path": snapshotPath])
            } else {
                onEncounteredError(["message": "Snapshot could not be taken"])
            }
        } else {
            onEncounteredError(["message": "Snapshot could not be taken"])
        }
    }

    func postAction(_ action: Int) {
        if let dialog = vlcDialog, let reference = vlcDialogRef {
            dialog.postAction(Int32(action), forDialogReference: reference)
            vlcDialogRef = nil
        }
    }

    func postLogin(_ username: String, _ password: String, _ store: Bool? = false) {
        if let dialog = vlcDialog, let reference = vlcDialogRef {
            dialog.postUsername(username, andPassword: password, forDialogReference: reference, store: store ?? false)
            vlcDialogRef = nil
        }
    }

    func dismiss() {
        if let dialog = vlcDialog, let reference = vlcDialogRef {
            dialog.dismissDialog(withReference: reference)
            vlcDialogRef = nil
        }
    }

    func startPictureInPicture() throws {
        try pictureDrawable.startPictureInPicture()
    }

    func stopPictureInPicture() {
        pictureDrawable.stopPictureInPicture()
    }

    func resetPictureInPicture() {
        guard let player = mediaPlayer,
              let videoTrack = player.videoTracks.first(where: { track in track.isSelected }),
              isInBackground else { return }

        videoTrack.isSelectedExclusively = true
        player.play()
        player.pause()
    }

    func onStartPictureInPicture() {
        onPictureInPictureStart()
    }

    func onStopPictureInPicture() {
        resetPictureInPicture()
        onPictureInPictureStop()
    }

    func retryUntil(
        maxRetries: Int = MediaPlayerConstants.maxRetryCount,
        retry: Int = 0,
        delay: Double = MediaPlayerConstants.retryDelayMs,
        block: @escaping (_ isLastAttempt: Bool) -> Bool
    ) {
        let isLastAttempt = retry > maxRetries

        if block(isLastAttempt) || isLastAttempt { return }

        let deadline = DispatchTime.now() + .milliseconds(Int(delay))
        let expDelay = delay * MediaPlayerConstants.expDelayMultiplier

        DispatchQueue.main.asyncAfter(deadline: deadline) { [weak self] in
            self?.retryUntil(maxRetries: maxRetries, retry: retry + 1, delay: expDelay, block: block)
        }
    }
}

extension LibVlcPlayerView: VLCMediaPlayerDelegate {
    func mediaPlayerStateChanged(_ newState: VLCMediaPlayerState) {
        if let player = mediaPlayer {
            switch newState {
            case .buffering:
                onBuffering()
            case .playing,
                 .paused,
                 .stopped:
                if newState == .playing {
                    onPlaying()

                    if firstPlay {
                        setPlayerTracks()

                        retryUntil { [weak self] isLastAttempt in
                            guard let self else { return true }

                            if hasVideoOut || isLastAttempt {
                                onFirstPlay(getMediaInfo())
                            }

                            return hasVideoOut
                        }

                        retryUntil { [weak self] _ in
                            guard let self else { return true }

                            if hasVideoSize {
                                setContentFit(drawable: playerDrawable)
                                setContentFit(drawable: pictureDrawable)
                            }

                            return hasVideoSize
                        }

                        retryUntil { [weak self] _ in
                            guard let self else { return true }

                            if hasAudioOut {
                                MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
                            }

                            return hasAudioOut
                        }

                        firstPlay = false
                    }
                }

                if newState == .paused {
                    onPaused()
                }

                if newState == .stopped {
                    onStopped()

                    firstPlay = true

                    if shouldRepeat {
                        player.play()
                    }
                }

                MediaPlayerManager.shared.keepAwakeManager.toggleKeepAwake()
                MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
                pictureDrawable.updatePipState()
            case .error:
                onEncounteredError(["message": "Player encountered an error"])

                player.stop()
            default:
                break
            }
        }
    }

    func mediaPlayerLengthChanged(_: Int64) {
        pictureDrawable.updatePipState()
    }

    func mediaPlayerTimeChanged(_: Notification) {
        if let player = mediaPlayer {
            onTimeChanged(["value": player.time.intValue])

            onPositionChanged(["value": player.position])
        }
    }

    func mediaPlayerTrackAdded(_: String, with _: VLCMedia.TrackType) {
        onESAdded(getMediaTracks())
    }

    func mediaPlayerStartedRecording(_: VLCMediaPlayer) {
        let recording = Recording(
            path: nil,
            isRecording: true
        )

        onRecordChanged(recording)
    }

    func mediaPlayer(recordingStoppedAt path: String) {
        let recording = Recording(
            path: path,
            isRecording: false
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
            type: "error"
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
            type: "login"
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
            type: "question",
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
    mutating func normalizeOptions() {
        self = map { option in
            if !option.hasPrefix(":") {
                ":" + option.drop { character in character == "-" }
            } else {
                option
            }
        }
    }
}

private extension [String] {
    mutating func toggleStartPausedOption(_ autoplay: Bool) {
        let hasOption = self.contains(":start-paused")

        if !autoplay, !hasOption {
            append(":start-paused")
        }
    }
}
