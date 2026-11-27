import ExpoModulesCore
import UIKit
import VLCKit

class LibVlcPlayerView: ExpoView {
  private var player: MediaPlayer!

  var mediaPlayer: VLCMediaPlayer? {
    player.mediaPlayer
  }

  let onBuffering = EventDispatcher()
  let onPlaying = EventDispatcher()
  let onPaused = EventDispatcher()
  let onStopped = EventDispatcher()
  let onEncounteredError = EventDispatcher()
  let onDialogDisplay = EventDispatcher()
  let onDialogProgress = EventDispatcher()
  let onDialogCanceled = EventDispatcher()
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
    clipsToBounds = true
    player = MediaPlayer(self)
    MediaPlayerManager.shared.registerExpoView(self)
  }

  deinit {
    MediaPlayerManager.shared.unregisterExpoView(self)
    destroyPlayer()
  }

  override var bounds: CGRect {
    didSet {
      player.applyBounds()
      player.applyContentFit()
    }
  }

  var source: String? {
    didSet {
      if source != oldValue {
        player.shouldInit = true
      }
    }
  }

  var metadata: Metadata? {
    didSet {
      MediaPlayerManager.shared.mediaPlaybackManager.updatePlaybackMetadata(self)
    }
  }

  var options: [String] = .init() {
    didSet {
      if options != oldValue {
        player.shouldInit = true
      }
    }
  }

  var slaves: [Slave] = .init() {
    didSet {
      let newSlaves = slaves.filter { slave in
        !oldValue
          .contains { existing in existing.source == slave.source && existing.type == slave.type }
      }

      if !newSlaves.isEmpty {
        player.addPlayerSlaves(newSlaves)
      }
    }
  }

  var tracks: Tracks? {
    didSet {
      player.setPlayerTracks()
    }
  }

  var delays: Delays? {
    didSet {
      player.setPlayerDelays()
    }
  }

  var scale: Double = MediaPlayerConstants.defaultPlayerScale {
    didSet {
      mediaPlayer?.scaleFactor = Float(scale)
    }
  }

  var contentFit: VideoContentFit = .contain {
    didSet {
      player.applyContentFit()
    }
  }

  var rate: Double = MediaPlayerConstants.defaultPlayerRate {
    didSet {
      let newRate = Float(rate)
      mediaPlayer?.rate = newRate
      MediaPlayerManager.shared.mediaPlaybackManager.updatePlaybackPosition(self, rate: newRate)
    }
  }

  var time: Int = MediaPlayerConstants.defaultPlayerTime

  var volume: Int = MediaPlayerConstants.maxPlayerVolume {
    didSet {
      if !mute {
        mediaPlayer?.audio?.volume = Int32(volume)

        let hadVolume = oldValue > 0
        let hasVolume = volume > 0

        if hadVolume != hasVolume {
          MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
        }
      }
    }
  }

  var mute: Bool = false {
    didSet {
      mediaPlayer?.audio?.volume = Int32(playerVolume)
      MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
    }
  }

  var playerVolume: Int {
    mute ? MediaPlayerConstants.minPlayerVolume : volume
  }

  var Repeat: Bool = false

  var autoplay: Bool = true

  var audioMixingMode: AudioMixingMode = .auto {
    didSet {
      MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
    }
  }

  var keepScreenAwake: Bool = true {
    didSet {
      MediaPlayerManager.shared.keepAwakeManager.toggleKeepAwake(self)
    }
  }

  var shouldKeepAwake: Bool {
    keepScreenAwake && mediaPlayer?.isPlaying == true && player.hasVideoTrack
  }

  var canPlayInBackground: Bool {
    playInBackground && MediaPlayerManager.shared.mediaPlaybackManager.isBackgroundPlaybackSupported
  }

  var isPlaybackView: Bool {
    canPlayInBackground && MediaPlayerManager.shared.mediaPlaybackManager.isPlaybackView(self)
  }

  var playInBackground: Bool = false {
    didSet {
      if playInBackground != oldValue {
        MediaPlayerManager.shared.mediaPlaybackManager.updatePlaybackView(self)
      }
    }
  }

  var pictureInPicture: Bool = false {
    didSet {
      if pictureInPicture != oldValue {
        player.shouldInit = true
      }
    }
  }

  func update(_ props: PlayerProps) {
    setIfChanged(\.source, props.source)
    setIfChanged(\.metadata, props.metadata)
    setIfChanged(\.options, props.options)
    setIfChanged(\.slaves, props.slaves)
    setIfChanged(\.tracks, props.tracks)
    setIfChanged(\.delays, props.delays)
    setIfChanged(\.scale, props.scale)
    setIfChanged(\.contentFit, props.contentFit)
    setIfChanged(\.rate, props.rate)
    setIfChanged(\.time, props.time)
    setIfChanged(\.volume, props.volume)
    setIfChanged(\.mute, props.mute)
    setIfChanged(\.Repeat, props.repeat)
    setIfChanged(\.autoplay, props.autoplay)
    setIfChanged(\.audioMixingMode, props.audioMixingMode)
    setIfChanged(\.keepScreenAwake, props.keepScreenAwake)
    setIfChanged(\.playInBackground, props.playInBackground)
    setIfChanged(\.pictureInPicture, props.pictureInPicture)
    initPlayer()
  }

  func initPlayer() {
    player.initPlayer()
  }

  func destroyPlayer() {
    player.stopPictureInPicture()
    player.destroyPlayer()
    MediaPlayerManager.shared.mediaPlaybackManager.removePlaybackView(ObjectIdentifier(self))
  }

  func getMediaMetadata() -> Metadata {
    player.getMetadata()
  }

  func getLength() -> Int64 {
    player.getLength()
  }

  func onStartPictureInPicture() {
    onPictureInPictureStart()
  }

  func onStopPictureInPicture() {
    onPictureInPictureStop()
  }

  func play() {
    player.withPlayer { mediaPlayer in
      if !autoplay {
        mediaPlayer.play()
      }

      mediaPlayer.play()
    }
  }

  func pause() {
    player.withPlayer { mediaPlayer in
      mediaPlayer.pause()
    }
  }

  func stop(userStop: Bool = true) {
    player.userStop = userStop

    player.withPlayer { mediaPlayer in
      mediaPlayer.stop()
    }
  }

  func seek(_ value: Double, _ type: String? = "time") {
    player.withPlayer { mediaPlayer in
      if !mediaPlayer.isSeekable {
        onEncounteredError(["message": "Media not seekable"])
        return
      }

      let newTime: Int64?

      if type == "position" {
        mediaPlayer.position = value
        newTime = Int64(value * Double(player.getLength()))
      } else {
        mediaPlayer.time = VLCTime(int: Int32(value))
        newTime = Int64(value)
      }

      MediaPlayerManager.shared.mediaPlaybackManager.updatePlaybackPosition(self, time: newTime)
    }
  }

  func seekBy(_ offset: Double, picture: Bool = false) {
    if let mediaPlayer {
      if picture {
        // AVKit skip workaround
        player.retryUntil { [weak self] _ in
          guard let self else { return true }

          if self.mediaPlayer?.state != .stopped {
            play()
          }

          return false
        }
      }

      seek(Double(mediaPlayer.time.intValue) + offset)
    }
  }

  func record(_ path: String?) {
    player.withPlayer(message: "Media could not be recorded") { mediaPlayer in
      if let path {
        mediaPlayer.startRecording(atPath: path)
      } else {
        mediaPlayer.stopRecording()
      }
    }
  }

  func snapshot(_ path: String) {
    let message = "Snapshot could not be taken"

    player.withPlayer(message: message) { mediaPlayer in
      if player.hasVideoSize, let snapshotPath = saveSnapshot(path, mediaPlayer) {
        onSnapshotTaken(["path": snapshotPath])
      } else {
        onEncounteredError(["message": message])
      }
    }
  }

  private func saveSnapshot(_ path: String, _ player: VLCMediaPlayer) -> String? {
    let dateFormatter = DateFormatter()
    dateFormatter.locale = Locale(identifier: "en_US_POSIX")
    dateFormatter.dateFormat = "yyyy-MM-dd-HH'h'mm'm'ss's'"
    let timestamp = dateFormatter.string(from: Date())

    let snapshotPath = path + "/libvlc-snapshot-\(timestamp).png"
    // Zero width and height keep the original video size
    player.saveVideoSnapshot(at: snapshotPath, withWidth: 0, andHeight: 0)

    return FileManager.default.fileExists(atPath: snapshotPath) ? snapshotPath : nil
  }

  func postAction(_ action: Int) {
    player.withDialog(VLCDialog.QuestionDialog.self) { dialog in
      dialog.postAction(action)
    }
  }

  func postLogin(_ username: String, _ password: String?, _ store: Bool? = false) {
    player.withDialog(VLCDialog.LoginDialog.self) { dialog in
      dialog.postLogin(username, password ?? "", store ?? false)
    }
  }

  func dismiss() {
    player.withDialog(VLCDialog.self) { dialog in
      dialog.dismiss()
    }
  }

  func startPictureInPicture() throws {
    try player.startPictureInPicture()
  }

  func stopPictureInPicture() {
    player.stopPictureInPicture()
  }
}

extension LibVlcPlayerView {
  private func setIfChanged<T: Equatable>(
    _ keyPath: ReferenceWritableKeyPath<LibVlcPlayerView, T>,
    _ value: T
  ) {
    if self[keyPath: keyPath] != value {
      self[keyPath: keyPath] = value
    }
  }
}
