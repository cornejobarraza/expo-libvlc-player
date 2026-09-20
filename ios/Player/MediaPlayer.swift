import ExpoModulesCore
import UIKit
import VLCKit

private let dialogCustomUI: Bool = true

class MediaPlayer: NSObject {
  private unowned let view: LibVlcPlayerView

  private let video: MediaPlayerDrawable = .init()
  private var picture: PictureInPictureDrawable!

  private var library: VLCLibrary?
  var mediaPlayer: VLCMediaPlayer?
  var vlcDialog: VLCDialogProvider?
  var vlcDialogRef: NSValue?

  var userStop: Bool = false
  private var firstPlay: Bool = true
  var shouldInit: Bool = true

  var hasVideoSize: Bool {
    let video = getVideo()
    return video.width > 0 && video.height > 0
  }

  private var hasMediaLength: Bool {
    let length = getLength()
    return length > 0
  }

  private var hasMediaVolume: Bool {
    let volume = mediaPlayer?.audio?.volume ?? Int32(MediaPlayerConstants.minPlayerVolume)
    return volume > MediaPlayerConstants.minPlayerVolume
  }

  init(_ view: LibVlcPlayerView) {
    self.view = view
    picture = PictureInPictureDrawable(view)
    super.init()
  }

  func applyBounds() {
    video.transform = .identity
    video.frame = view.bounds
    picture.transform = .identity
    picture.frame = view.bounds
  }

  func initPlayer() {
    if shouldInit {
      destroyPlayer()

      if view.source != nil {
        createPlayer()
      }
    }
  }

  private func createPlayer() {
    let drawable = view.pictureInPicture
      ? picture!
      : video

    library = VLCLibrary()
    mediaPlayer = VLCMediaPlayer(library: library!)
    mediaPlayer!.drawable = drawable
    mediaPlayer!.delegate = self
    addPlayerSlaves(view.slaves)

    vlcDialog = VLCDialogProvider(library: library!, customUI: dialogCustomUI)
    vlcDialog!.customRenderer = self

    guard let source = view.source, let url = URL(string: source) else {
      view.onEncounteredError(["message": "Invalid source, media could not be set"])
      return
    }

    var args = view.options
    args.normalizeOptions()
    args.toggleStartPausedOption(view.autoplay)

    let media = VLCMedia(url: url)
    args.forEach { arg in media!.addOption(arg) }
    mediaPlayer!.media = media
    mediaPlayer!.play()

    firstPlay = true
    shouldInit = false

    view.subviews.forEach { subview in subview.removeFromSuperview() }
    view.addSubview(drawable)
  }

  func destroyPlayer() {
    library = nil
    mediaPlayer?.stop()
    mediaPlayer = nil
    vlcDialog?.customRenderer = nil
    vlcDialog = nil
  }

  private func setupPlayer() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }

      if let player = mediaPlayer {
        if view.scale != MediaPlayerConstants.defaultPlayerScale {
          player.scaleFactor = Float(view.scale)
        }

        if view.rate != MediaPlayerConstants.defaultPlayerRate {
          player.rate = Float(view.rate)
        }

        if view.time != MediaPlayerConstants.defaultPlayerTime {
          player.time = VLCTime(int: Int32(view.time))
        }

        // Negative volume workaround
        retryUntil { [weak self] _ in
          guard let self else { return true }

          let newVolume = view.mute ?
            MediaPlayerConstants.minPlayerVolume :
            view.volume

          player.audio?.volume = Int32(newVolume)

          return false
        }

        view.time = MediaPlayerConstants.defaultPlayerTime
      }
    }
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
        view.onEncounteredError(["message": "Invalid source, \(type) could not be added"])
        continue
      }

      mediaPlayer?.addPlaybackSlave(url, type: slaveType, enforce: selected)
    }
  }

  private func selectTrack(_ index: Int, _ type: VLCMedia.TrackType) {
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
    let audioTrack = view.tracks?.audio
    let videoTrack = view.tracks?.video
    let textTrack = view.tracks?.subtitle

    if let audioTrack { selectTrack(audioTrack, .audio) }
    if let videoTrack { selectTrack(videoTrack, .video) }
    if let textTrack { selectTrack(textTrack, .text) }
  }

  func setPlayerDelays() {
    if let player = mediaPlayer {
      let audioDelay = view.delays?.audio
      let textDelay = view.delays?.subtitle

      if let audioDelay { player.currentAudioPlaybackDelay = NSInteger(audioDelay) }
      if let textDelay { player.currentVideoSubTitleDelay = NSInteger(textDelay) }
    }
  }

  private func setContentFit(drawable: MediaPlayerDrawable) {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }

      var transform: CGAffineTransform = .identity

      let video = getVideo()

      if hasVideoSize == true {
        let viewAspect = drawable.frame.size.width / drawable.frame.size.height
        let videoAspect = CGFloat(video.width) / CGFloat(video.height)

        switch view.contentFit {
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

  func applyContentFit() {
    setContentFit(drawable: video)
    setContentFit(drawable: picture)
  }

  private func getMediaTracks() -> MediaTracks {
    guard let player = mediaPlayer else { return MediaTracks() }

    let disableTrack = MediaTrack(id: -1, name: "Disable")

    let audios = player.audioTracks.enumerated()
    let videos = player.videoTracks.enumerated()
    let subtitles = player.textTracks.enumerated()

    let audio = [disableTrack] + audios.map { index, audio in MediaTrack(
      id: index,
      name: audio.trackName
    ) }
    let video = [disableTrack] + videos.map { index, video in MediaTrack(
      id: index,
      name: video.trackName
    ) }
    let subtitle = [disableTrack] + subtitles.map { index, subtitle in MediaTrack(
      id: index,
      name: subtitle.trackName
    ) }

    return MediaTracks(
      audio: audio,
      video: video,
      subtitle: subtitle
    )
  }

  private func getMedia() -> Media {
    let length = Int(mediaPlayer?.media?.length.intValue ?? 0)
    let seekable = mediaPlayer?.isSeekable ?? false

    return Media(
      length: length,
      seekable: seekable
    )
  }

  private func getMetadata() -> Metadata {
    guard let metaData = mediaPlayer?.media?.metaData else {
      return Metadata()
    }

    let title = metaData.title
    let artist = metaData.artist
    let album = metaData.album
    let artworkURL = metaData.artworkURL?.absoluteString

    return Metadata(
      title: title,
      artist: artist,
      album: album,
      artworkURL: artworkURL
    )
  }

  private func getVideo() -> Video {
    guard let track = mediaPlayer?.videoTracks.first(where: { track in track.isSelected }),
          let video = track.video
    else {
      return Video()
    }

    let width = Int(video.width)
    let height = Int(video.height)
    let frameRate = video.frameRateDenominator != 0 ?
      Int(video.frameRate / video.frameRateDenominator) :
      0
    let bitrate = Int(track.bitrate)

    return Video(
      width: width,
      height: height,
      frameRate: frameRate,
      bitrate: bitrate
    )
  }

  private func getMediaInfo() -> MediaInfo {
    let media = getMedia()
    let metadata = getMetadata()
    let video = getVideo()

    return MediaInfo(
      media: media,
      metadata: metadata,
      video: video
    )
  }

  private func getLength() -> Int {
    Int(mediaPlayer?.media?.length.intValue ?? 0)
  }

  func startPictureInPicture() throws {
    try picture.startPictureInPicture()
  }

  func stopPictureInPicture() {
    picture.stopPictureInPicture()
  }

  private func retryUntil(
    maxRetries: Int = MediaPlayerConstants.maxRetryCount,
    retry: Int = 0,
    delay: Double = MediaPlayerConstants.retryDelayMs,
    block: @escaping (_ isLastAttempt: Bool) -> Bool
  ) {
    let isLastAttempt = retry > maxRetries

    if block(isLastAttempt) || isLastAttempt { return }

    let wait = retry > 0 ? delay : 0
    let nextDelay = retry > 0 ? delay * MediaPlayerConstants.expDelayMultiplier : delay
    let deadline = DispatchTime.now() + DispatchTimeInterval.milliseconds(Int(wait))

    DispatchQueue.main.asyncAfter(deadline: deadline) { [weak self] in
      self?.retryUntil(
        maxRetries: maxRetries,
        retry: retry + 1,
        delay: nextDelay,
        block: block
      )
    }
  }
}

extension MediaPlayer: VLCMediaPlayerDelegate {
  func mediaPlayerStateChanged(_ newState: VLCMediaPlayerState) {
    guard let player = mediaPlayer else { return }

    switch newState {
    case .playing,
         .paused,
         .stopped:
      if newState == .playing {
        view.onPlaying()

        if firstPlay {
          setupPlayer()
          setPlayerTracks()
          setPlayerDelays()

          retryUntil { [weak self] _ in
            guard let self else { return true }

            if hasVideoSize {
              applyContentFit()
            }

            return hasVideoSize
          }

          retryUntil { [weak self] _ in
            guard let self else { return true }

            if hasMediaVolume {
              MediaPlayerManager.shared.audioSessionManager
                .setAppropriateAudioSession()
            }

            return hasMediaVolume
          }

          retryUntil { [weak self] isLastAttempt in
            guard let self else { return true }

            if hasMediaLength || isLastAttempt {
              view.onFirstPlay(getMediaInfo())
            }

            return hasMediaLength
          }

          firstPlay = false
        }
      }

      if newState == .paused {
        view.onPaused()
      }

      if newState == .stopped {
        view.onStopped()

        if view.Repeat, !userStop {
          player.play()
        }

        userStop = false
        firstPlay = true
      }

      MediaPlayerManager.shared.keepAwakeManager.toggleKeepAwake()
      MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
      picture.updatePipState()
    case .error:
      view.onEncounteredError(["message": "Player encountered an error"])

      player.stop()
    default:
      break
    }
  }

  func mediaPlayerBufferingChanged(_ buffering: Float) {
    view.onBuffering(["value": buffering])
  }

  func mediaPlayerLengthChanged(_: Int64) {
    picture.updatePipState()
  }

  func mediaPlayerTimeChanged(_: Notification) {
    guard let player = mediaPlayer else { return }

    view.onTimeChanged(["value": player.time.intValue])
    view.onPositionChanged(["value": player.position])
  }

  func mediaPlayerTrackAdded(_: String, with _: VLCMedia.TrackType) {
    view.onESAdded(getMediaTracks())
  }

  func mediaPlayerStartedRecording(_: VLCMediaPlayer) {
    let recording = Recording(
      path: nil,
      isRecording: true
    )

    view.onRecordChanged(recording)
  }

  func mediaPlayer(recordingStoppedAt path: String) {
    let recording = Recording(
      path: path,
      isRecording: false
    )

    view.onRecordChanged(recording)
  }
}

extension MediaPlayer: VLCCustomDialogRendererProtocol {
  func showError(
    withTitle title: String,
    message: String
  ) {
    let dialog = Dialog(
      title: title,
      text: message,
      type: "error"
    )

    view.onDialogDisplay(dialog)
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

    view.onDialogDisplay(dialog)
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

    view.onDialogDisplay(dialog)
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
