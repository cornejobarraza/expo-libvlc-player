import MediaPlayer
import UIKit
import VLCKit

class MediaPlaybackManager {
  private weak var sessionView: LibVlcPlayerView?
  private var sessionViewID: ObjectIdentifier?
  private var commandTargets: [(MPRemoteCommand, Any)] = []
  private var artworkTask: URLSessionDataTask?
  private var artworkURL: String?
  private var artwork: MPMediaItemArtwork?

  private var mediaPlayer: VLCMediaPlayer? {
    sessionView?.mediaPlayer
  }

  private var metadata: Metadata? {
    guard let view = sessionView else { return nil }

    let viewMetadata = view.metadata
    let mediaMetadata = view.getMediaMetadata()
    let mediaArtworkURL = mediaMetadata.artworkURL.flatMap { url -> String? in
      let scheme = URL(string: url)?.scheme?.lowercased()

      return scheme.map(MediaPlayerConstants.mediaArtworkSchemes.contains) == true ? url : nil
    }

    return Metadata(
      title: viewMetadata?.title ?? mediaMetadata.title,
      artist: viewMetadata?.artist ?? mediaMetadata.artist,
      album: viewMetadata?.album ?? mediaMetadata.album,
      artworkURL: viewMetadata?.artworkURL ?? mediaArtworkURL
    )
  }

  lazy var isBackgroundPlaybackSupported: Bool = {
    let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String]
    return backgroundModes?.contains(MediaPlayerConstants.audioBackgroundMode) == true
  }()

  var isNowPlayingEligible: Bool {
    guard let view = sessionView else { return false }

    let isAudible = !view.mute && view.volume > MediaPlayerConstants.minPlayerVolume
    let isMixable = view.audioMixingMode == .mixWithOthers || view.audioMixingMode == .duckOthers

    return isAudible && !isMixable
  }

  func isPlaybackView(_ view: LibVlcPlayerView) -> Bool {
    sessionView === view
  }

  func refreshPlaybackView(_ view: LibVlcPlayerView) {
    DispatchQueue.main.async { [weak self, weak view] in
      guard let self, let view else { return }

      refreshSession(view)
    }
  }

  func updatePlaybackSource(_ view: LibVlcPlayerView) {
    onSession(view) { manager in manager.updatePlaybackMetadata() }
  }

  func updatePlaybackView(_ view: LibVlcPlayerView) {
    DispatchQueue.main.async { [weak self, weak view] in
      guard let self, let view else { return }

      if sessionView === view, !isEligible(view) {
        reassignSessionView()
      } else {
        refreshSession(view)
      }
    }
  }

  func updatePlaybackMetadata(_ view: LibVlcPlayerView) {
    onSession(view) { manager in manager.updatePlaybackMetadata() }
  }

  func updatePlaybackPosition(_ view: LibVlcPlayerView, time: Int64? = nil, rate: Float? = nil) {
    onSession(view) { manager in manager.setPlaybackState(time: time, rate: rate) }
  }

  func removePlaybackView(_ viewID: ObjectIdentifier) {
    DispatchQueue.main.async { [weak self] in
      guard let self, sessionViewID == viewID else { return }

      reassignSessionView()
    }
  }

  private func onSession(
    _ view: LibVlcPlayerView,
    _ body: @escaping (MediaPlaybackManager) -> Void
  ) {
    DispatchQueue.main.async { [weak self, weak view] in
      guard let self, let view, sessionView === view else { return }

      body(self)
    }
  }

  private func isEligible(_ view: LibVlcPlayerView) -> Bool {
    view.canPlayInBackground && view.mediaPlayer != nil
  }

  private func canClaimSession(_ view: LibVlcPlayerView) -> Bool {
    isEligible(view) && view.mediaPlayer?.isPlaying == true && mediaPlayer?.isPlaying != true
  }

  private func refreshSession(_ view: LibVlcPlayerView) {
    if sessionView !== view, canClaimSession(view) {
      setSessionView(view)
    } else if sessionView === view, view.mediaPlayer?.isPlaying != true,
              let nextView = findPlayingView(excluding: view)
    {
      setSessionView(nextView)
    }

    if sessionView === view {
      setPlaybackState()
    }
  }

  private func setSessionView(_ view: LibVlcPlayerView) {
    sessionView = view
    sessionViewID = ObjectIdentifier(view)

    if commandTargets.isEmpty {
      addCommandTargets()
    }

    updatePlaybackMetadata()
    MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
  }

  private func reassignSessionView() {
    sessionView = nil
    sessionViewID = nil

    if let nextView = findNextPlaybackView() {
      setSessionView(nextView)
    } else {
      clearNowPlaying()
      MediaPlayerManager.shared.audioSessionManager.setAppropriateAudioSession()
    }
  }

  private func findPlayingView(excluding excludedView: LibVlcPlayerView) -> LibVlcPlayerView? {
    MediaPlayerManager.shared.expoViews.allObjects.first { view in
      view !== excludedView && isEligible(view) && view.mediaPlayer?.isPlaying == true
    }
  }

  private func findNextPlaybackView() -> LibVlcPlayerView? {
    let views = MediaPlayerManager.shared.expoViews.allObjects.filter { view in
      let player = view.mediaPlayer

      return isEligible(view) && (player?.isPlaying == true || player?.state == .paused)
    }

    return views.first { view in view.mediaPlayer?.isPlaying == true } ?? views.first
  }

  private func clearNowPlaying() {
    removeCommandTargets()
    resetArtwork()
    MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
  }

  private func updatePlaybackMetadata() {
    guard let metadata, let view = sessionView, let player = mediaPlayer else { return }

    updateArtwork(metadata.artworkURL)

    let length = view.getLength()
    let hasLength = length > 0

    var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]

    info[MPMediaItemPropertyTitle] = metadata.title
    info[MPMediaItemPropertyArtist] = metadata.artist
    info[MPMediaItemPropertyAlbumTitle] = metadata.album
    info[MPMediaItemPropertyArtwork] = artwork
    info[MPMediaItemPropertyPlaybackDuration] = hasLength ? Double(length) / 1000 : nil
    info[MPNowPlayingInfoPropertyIsLiveStream] = !hasLength
    info[MPNowPlayingInfoPropertyMediaType] = MPNowPlayingInfoMediaType.video.rawValue

    applyPlaybackState(player, to: &info)

    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
  }

  private func setPlaybackState(time: Int64? = nil, rate: Float? = nil) {
    guard let player = mediaPlayer else { return }

    var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]

    applyPlaybackState(player, to: &info, time: time, rate: rate)

    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
  }

  private func applyPlaybackState(
    _ player: VLCMediaPlayer,
    to info: inout [String: Any],
    time: Int64? = nil,
    rate: Float? = nil
  ) {
    let isStopped = player.state == .stopped
    let isSeekable = player.isSeekable
    let position = !isStopped ? time ?? Int64(player.time.intValue) : 0
    let speed = Double(rate ?? player.rate)

    info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = Double(max(position, 0)) / 1000
    info[MPNowPlayingInfoPropertyPlaybackRate] = player.isPlaying ? speed : 0
    info[MPNowPlayingInfoPropertyDefaultPlaybackRate] = speed

    let commandCenter = MPRemoteCommandCenter.shared()

    commandCenter.changePlaybackPositionCommand.isEnabled = isSeekable
    commandCenter.skipForwardCommand.isEnabled = isSeekable
    commandCenter.skipBackwardCommand.isEnabled = isSeekable
  }

  private func addCommandTargets() {
    let commandCenter = MPRemoteCommandCenter.shared()

    func addTarget(
      _ command: MPRemoteCommand,
      _ handler: @escaping (LibVlcPlayerView, VLCMediaPlayer, MPRemoteCommandEvent) -> Void
    ) {
      let target = command.addTarget { [weak self] event in
        if let view = self?.sessionView, let player = view.mediaPlayer {
          handler(view, player, event)

          return .success
        }

        return .noActionableNowPlayingItem
      }

      command.isEnabled = true
      commandTargets.append((command, target))
    }

    addTarget(commandCenter.playCommand) { view, _, _ in
      view.play()
    }

    addTarget(commandCenter.pauseCommand) { view, _, _ in
      view.pause()
    }

    addTarget(commandCenter.togglePlayPauseCommand) { view, player, _ in
      if player.isPlaying {
        view.pause()
      } else {
        view.play()
      }
    }

    addTarget(commandCenter.changePlaybackPositionCommand) { view, _, event in
      guard let event = event as? MPChangePlaybackPositionCommandEvent else { return }

      view.seek(event.positionTime * 1000)
    }

    let seekStep = MediaPlayerConstants.seekStep
    let skipCommands = [
      (commandCenter.skipForwardCommand, 1.0),
      (commandCenter.skipBackwardCommand, -1.0),
    ]

    for (command, direction) in skipCommands {
      command.preferredIntervals = [NSNumber(value: seekStep)]

      addTarget(command) { view, _, event in
        let interval = (event as? MPSkipIntervalCommandEvent)?.interval ?? seekStep

        view.seekBy(direction * interval * 1000)
      }
    }
  }

  private func removeCommandTargets() {
    for (command, target) in commandTargets {
      command.removeTarget(target)
      command.isEnabled = false
    }

    commandTargets.removeAll()
  }

  private func resetArtwork(_ url: String? = nil) {
    artworkTask?.cancel()
    artworkTask = nil
    artworkURL = url
    artwork = nil
  }

  private func updateArtwork(_ url: String?) {
    guard url != artworkURL else { return }

    resetArtwork(url)

    guard let url, let uri = URL(string: url), let scheme = uri.scheme?.lowercased() else { return }

    let onImage: (UIImage?) -> Void = { [weak self] image in
      DispatchQueue.main.async { [weak self] in
        guard let self, artworkURL == url else { return }

        artwork = image.map { image in MPMediaItemArtwork(boundsSize: image.size) { _ in image } }
        artworkTask = nil
        updatePlaybackMetadata()
      }
    }

    if scheme == "http" || scheme == "https" {
      let request = URLRequest(url: uri, timeoutInterval: MediaPlayerConstants.artworkTimeout)

      artworkTask = URLSession.shared.dataTask(with: request) { data, _, error in
        if (error as? URLError)?.code == .cancelled { return }

        onImage(data.flatMap { data in UIImage(data: data) })
      }

      artworkTask?.resume()
    } else {
      DispatchQueue.global(qos: .utility).async {
        let data = try? Data(contentsOf: uri)

        onImage(data.flatMap { data in UIImage(data: data) })
      }
    }
  }
}
