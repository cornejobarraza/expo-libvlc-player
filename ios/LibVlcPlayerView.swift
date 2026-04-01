import ExpoModulesCore
import UIKit
import VLCKit

private let dialogCustomUI: Bool = true

class LibVlcPlayerView: ExpoView {
    private let playerDrawable: MediaPlayerDrawable = .init()
    private var pictureDrawable: PictureInPictureDrawable!

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
        var args = options
        args.toggleStartPausedOption(autoplay)

        var drawable: MediaPlayerDrawable

        if pictureInPicture {
            playerDrawable.removeFromSuperview()
            drawable = pictureDrawable
        } else {
            pictureDrawable?.removeFromSuperview()
            drawable = playerDrawable
        }

        mediaPlayer = VLCMediaPlayer(options: args)
        mediaPlayer!.drawable = drawable
        mediaPlayer!.delegate = self
        setupPlayer()

        let library = mediaPlayer!.libraryInstance
        vlcDialog = VLCDialogProvider(library: library, customUI: dialogCustomUI)
        vlcDialog!.customRenderer = self

        guard let source, let url = URL(string: source) else {
            onEncounteredError(["error": "Invalid source, media could not be set"])
            return
        }

        mediaPlayer!.media = VLCMedia(url: url)
        mediaPlayer!.play()

        firstPlay = true
        shouldInit = false

        addSubview(drawable)
    }

    func destroyPlayer() {
        mediaPlayer?.stop()
        mediaPlayer = nil
        vlcDialog?.customRenderer = nil
        vlcDialog = nil
    }

    func selectTrack(_ trackId: Int?, _ type: VLCMedia.TrackType) {
        if let player = mediaPlayer {
            if trackId == -1 {
                switch type {
                case .audio: player.deselectAllAudioTracks()
                case .video: player.deselectAllVideoTracks()
                case .text: player.deselectAllTextTracks()
                default: break
                }
                return
            }

            let tracks: [VLCMediaPlayer.Track]? = switch type {
            case .audio: player.audioTracks
            case .video: player.videoTracks
            case .text: player.textTracks
            default: nil
            }

            guard let tracks else { return }

            let firstTrack = tracks.first?.trackId
            let firstTrackInt = firstTrack.map { id in (id as NSString).intValue }
            let firstTrackId = firstTrackInt.map { id in Int(id) }
            let index = trackId ?? firstTrackId

            guard let index else { return }

            player.selectTrack(at: index, type: type)
        }
    }

    func setPlayerTracks() {
        let audioTrack = tracks?.audio
        let videoTrack = tracks?.video
        let textTrack = tracks?.subtitle

        selectTrack(audioTrack, .audio)
        selectTrack(videoTrack, .video)
        selectTrack(textTrack, .text)
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

            drawable.transform = transform
        }
    }

    func setupPlayer() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            if let player = mediaPlayer {
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

    func getMediaInfo() -> MediaInfo {
        var mediaInfo = MediaInfo()

        if let player = mediaPlayer {
            let video = getVideoSize()
            let length = getMediaLength()
            let seekable = player.isSeekable

            mediaInfo = MediaInfo(
                width: Int(video.width),
                height: Int(video.height),
                length: Double(length),
                seekable: seekable
            )
        }

        return mediaInfo
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
            setContentFit(drawable: playerDrawable)
            setContentFit(drawable: pictureDrawable)
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
            if shouldPause { player.pause() }
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
            onEncounteredError(["error": "Media could not be recorded"])
        }
    }

    func snapshot(_ path: String) {
        if hasVideoSize {
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd-HH'h'mm'm'ss's'"
            let timestamp = dateFormatter.string(from: Date())

            let snapshotPath = path + "/vlc-snapshot-\(timestamp).jpg"
            let video = getVideoSize()

            mediaPlayer?.saveVideoSnapshot(at: snapshotPath, withWidth: Int32(video.width), andHeight: Int32(video.height))

            onSnapshotTaken(["path": snapshotPath])
        } else {
            onEncounteredError(["error": "Snapshot could not be taken"])
            return
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
        delay: Int = MediaPlayerConstants.retryDelayMs,
        block: @escaping (_ isLastAttempt: Bool) -> Bool
    ) {
        let isLastAttempt = retry >= maxRetries

        if block(isLastAttempt) || isLastAttempt { return }

        let expDelay = Int(Double(delay) * 1.5)

        DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(delay)) { [weak self] in
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

                pictureDrawable.updatePipState()
                MediaPlayerManager.shared.keepAwakeManager.toggleKeepAwake()

                retryUntil { [weak self] _ in
                    guard let self else { return true }

                    if hasAudioOut {
                        MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
                    }

                    return hasAudioOut
                }
            case .error:
                onEncounteredError(["error": "Player encountered an error"])

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
            onTimeChanged(["time": player.time.intValue])

            onPositionChanged(["position": player.position])
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
            text: message
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
            text: message
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
