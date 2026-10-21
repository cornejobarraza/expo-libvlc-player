import ExpoModulesCore
import MediaPlayer
import VLCKit

private let skipInterval: TimeInterval = 10

/// Mirrors the active player into the system Now Playing controls (lock screen, Control Center)
/// the way VLC for iOS does: static metadata once, playback state on every time change
class NowPlayingManager {
  private weak var activeView: LibVlcPlayerView?
  private var artworkURL: String?
  private var artwork: MPMediaItemArtwork?
  private var commandTargets: [(MPRemoteCommand, Any)] = []
  private var lastStateUpdate = Date.distantPast

  func update(_ view: LibVlcPlayerView, elapsed: Double? = nil) {
    guard let metadata = view.nowPlaying, let player = view.mediaPlayer else {
      clear(view)
      return
    }

    if activeView !== view {
      activeView = view
      registerCommands()
    }

    var info: [String: Any] = [:]
    info[MPMediaItemPropertyTitle] = metadata.title
    info[MPMediaItemPropertyArtist] = metadata.artist
    info[MPMediaItemPropertyAlbumTitle] = metadata.album
    info[MPNowPlayingInfoPropertyMediaType] = view.hasVideoSize
      ? MPNowPlayingInfoMediaType.video.rawValue
      : MPNowPlayingInfoMediaType.audio.rawValue
    info[MPNowPlayingInfoPropertyDefaultPlaybackRate] = 1.0

    // Fetched once per URL: a change starts a new fetch, an in-flight or failed one isn't retried
    if artworkURL != metadata.artworkURL {
      loadArtwork(metadata.artworkURL)
    }

    if let artwork {
      info[MPMediaItemPropertyArtwork] = artwork
    }

    applyPlaybackState(&info, player, elapsed: elapsed)
    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
  }

  /// Called on every time change: cheap, keeps elapsed time and rate honest after buffering,
  /// rate changes or Picture-in-Picture. Throttled to once per second
  func refresh(_ view: LibVlcPlayerView) {
    guard activeView === view, let player = view.mediaPlayer,
          Date().timeIntervalSince(lastStateUpdate) >= 1,
          var info = MPNowPlayingInfoCenter.default().nowPlayingInfo
    else { return }

    applyPlaybackState(&info, player, elapsed: nil)
    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
  }

  func clear(_ view: LibVlcPlayerView) {
    guard activeView === view else { return }
    reset()
  }

  /// Called from the view's deinit: its weak reference is already nil by then
  func clearIfReleased() {
    guard activeView == nil else { return }
    reset()
  }

  private func applyPlaybackState(
    _ info: inout [String: Any],
    _ player: VLCMediaPlayer,
    elapsed: Double?
  ) {
    let duration = Double(player.media?.length.intValue ?? 0) / 1000
    let isLiveStream = duration <= 0

    // A seek is asynchronous: the caller passes the target time so the control doesn't jump back
    info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = elapsed ?? Double(player.time.intValue) /
      1000
    info[MPNowPlayingInfoPropertyPlaybackRate] = player.isPlaying ? Double(player.rate) : 0
    info[MPNowPlayingInfoPropertyIsLiveStream] = isLiveStream

    if isLiveStream {
      info.removeValue(forKey: MPMediaItemPropertyPlaybackDuration)
    } else {
      info[MPMediaItemPropertyPlaybackDuration] = duration
    }

    let center = MPRemoteCommandCenter.shared()
    center.changePlaybackPositionCommand.isEnabled = !isLiveStream
    center.skipForwardCommand.isEnabled = !isLiveStream
    center.skipBackwardCommand.isEnabled = !isLiveStream

    lastStateUpdate = Date()
  }

  private func reset() {
    activeView = nil
    artwork = nil
    artworkURL = nil
    unregisterCommands()
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
  }

  private func loadArtwork(_ urlString: String?) {
    artwork = nil
    artworkURL = urlString

    guard let urlString, let url = URL(string: urlString) else { return }

    URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
      guard let data, let image = UIImage(data: data) else { return }

      DispatchQueue.main.async {
        guard let self, self.artworkURL == urlString else { return }

        self.artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }

        if let view = self.activeView {
          self.update(view)
        }
      }
    }.resume()
  }

  private func registerCommands() {
    unregisterCommands()

    let center = MPRemoteCommandCenter.shared()

    // The lock screen shows either skip or next/previous buttons: a single media wants skip
    center.skipForwardCommand.preferredIntervals = [NSNumber(value: skipInterval)]
    center.skipBackwardCommand.preferredIntervals = [NSNumber(value: skipInterval)]
    for command in [center.nextTrackCommand, center.previousTrackCommand,
                    center.seekForwardCommand, center.seekBackwardCommand]
    {
      command.isEnabled = false
    }

    func add(
      _ command: MPRemoteCommand,
      _ handler: @escaping (MPRemoteCommandEvent) -> MPRemoteCommandHandlerStatus
    ) {
      commandTargets.append((command, command.addTarget(handler: handler)))
    }

    add(center.playCommand) { [weak self] _ in
      self?.activeView?.play()
      return .success
    }

    add(center.pauseCommand) { [weak self] _ in
      self?.activeView?.pause()
      return .success
    }

    add(center.stopCommand) { [weak self] _ in
      self?.activeView?.stop()
      return .success
    }

    add(center.togglePlayPauseCommand) { [weak self] _ in
      guard let view = self?.activeView else { return .noActionableNowPlayingItem }
      view.mediaPlayer?.isPlaying == true ? view.pause() : view.play()
      return .success
    }

    add(center.changePlaybackPositionCommand) { [weak self] event in
      guard let view = self?.activeView,
            let event = event as? MPChangePlaybackPositionCommandEvent
      else { return .commandFailed }
      view.seek(event.positionTime * 1000)
      return .success
    }

    add(center.skipForwardCommand) { [weak self] event in
      self?
        .skip(by: (event as? MPSkipIntervalCommandEvent)?.interval ?? skipInterval) ??
        .commandFailed
    }

    add(center.skipBackwardCommand) { [weak self] event in
      self?
        .skip(by: -((event as? MPSkipIntervalCommandEvent)?.interval ?? skipInterval)) ??
        .commandFailed
    }
  }

  private func unregisterCommands() {
    for (command, target) in commandTargets {
      command.removeTarget(target)
    }
    commandTargets = []
  }

  private func skip(by seconds: TimeInterval) -> MPRemoteCommandHandlerStatus {
    guard let view = activeView,
          let player = view.mediaPlayer else { return .noActionableNowPlayingItem }
    let length = Double(player.media?.length.intValue ?? 0)
    let target = max(0, Double(player.time.intValue) + seconds * 1000)
    view.seek(length > 0 ? min(target, length) : target)
    return .success
  }
}
