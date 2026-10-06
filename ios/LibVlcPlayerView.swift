import ExpoModulesCore
import UIKit
import VLCKit

class LibVlcPlayerView: ExpoView {
  private var player: MediaPlayer!

  var mediaPlayer: VLCMediaPlayer? {
    player.mediaPlayer
  }

  private var oldVolume: Int = MediaPlayerConstants.maxPlayerVolume

  let onBuffering = EventDispatcher()
  let onPlaying = EventDispatcher()
  let onPaused = EventDispatcher()
  let onStopped = EventDispatcher()
  let onEncounteredError = EventDispatcher()
  let onDialogDisplay = EventDispatcher()
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

  func initPlayer() {
    player.initPlayer()
  }

  func destroyPlayer() {
    player.destroyPlayer()
  }

  func onStartPictureInPicture() {
    onPictureInPictureStart()
  }

  func onStopPictureInPicture() {
    onPictureInPictureStop()
  }

  var source: String? {
    didSet {
      player.shouldInit = true
    }
  }

  var options: [String] = .init() {
    didSet {
      player.shouldInit = true
    }
  }

  private var _slaves: [Slave] = .init()

  var slaves: [Slave] {
    get { _slaves }
    set {
      let newSlaves = newValue.filter { slave in
        !_slaves
          .contains { existing in existing.source == slave.source && existing.type == slave.type }
      }

      _slaves += newSlaves

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
      mediaPlayer?.rate = Float(rate)
    }
  }

  var time: Int = MediaPlayerConstants.defaultPlayerTime

  private var _volume: Int = MediaPlayerConstants.maxPlayerVolume

  var volume: Int {
    get { _volume }
    set {
      let oldValue = _volume
      let newVolume = max(
        MediaPlayerConstants.minPlayerVolume,
        min(MediaPlayerConstants.maxPlayerVolume, newValue)
      )

      _volume = newVolume

      if mute { return }

      mediaPlayer?.audio?.volume = Int32(newVolume)

      let hadVolume = oldValue > MediaPlayerConstants.minPlayerVolume
      let hasVolume = newVolume > MediaPlayerConstants.minPlayerVolume

      if hadVolume != hasVolume {
        MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
      }
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

  var Repeat: Bool = false

  var autoplay: Bool = true

  var pictureInPicture: Bool = false {
    didSet {
      player.shouldInit = true
    }
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

  func stop() {
    player.withPlayer { mediaPlayer in
      player.userStop = true
      mediaPlayer.stop()
    }
  }

  func seek(_ value: Double, _ type: String? = "time") {
    player.withPlayer { mediaPlayer in
      if type == "position" {
        mediaPlayer.position = value
      } else {
        mediaPlayer.time = VLCTime(int: Int32(value))
      }
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
      if player.hasVideoSize {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd-HH'h'mm'm'ss's'"
        let timestamp = dateFormatter.string(from: Date())

        let snapshotPath = path + "/vlc-snapshot-\(timestamp).jpg"
        let video = CGSize(width: 0, height: 0) // Use original window size

        mediaPlayer.saveVideoSnapshot(
          at: snapshotPath,
          withWidth: Int32(video.width),
          andHeight: Int32(video.height)
        )

        let fileExists = FileManager.default.fileExists(atPath: snapshotPath)

        if fileExists {
          onSnapshotTaken(["path": snapshotPath])
        } else {
          onEncounteredError(["message": message])
        }
      } else {
        onEncounteredError(["message": message])
      }
    }
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
