import AVFoundation
import ExpoModulesCore
import Foundation
import VLCKit

class AudioSessionManager {
  private static let managerQueue = DispatchQueue(label: "audioManagerQueue")

  private lazy var expoViews = MediaPlayerManager.shared.expoViews

  private var mediaPlayers: [VLCMediaPlayer] {
    expoViews.allObjects.compactMap { view in view.mediaPlayer }
  }

  func setAppropriateAudioSession() {
    let isNowPlayingEligible = MediaPlayerManager.shared.mediaPlaybackManager.isNowPlayingEligible

    Self.managerQueue.async { [weak self] in
      self?.setAudioSession(isNowPlayingEligible)
    }
  }

  private func setAudioSession(_ isNowPlayingEligible: Bool) {
    let audioSession = AVAudioSession.sharedInstance()
    let audioMixingMode = findAudioMixingMode()
    var audioSessionCategoryOptions: AVAudioSession.CategoryOptions = audioSession
      .categoryOptions

    let anyPlayingView = mediaPlayers.contains { player in
      playerRequiresCategory(player)
    }

    let shouldMixOverride = audioMixingMode == .mixWithOthers
    let doNotMixOverride = audioMixingMode == .doNotMix
    let shouldDuckOthers = audioMixingMode == .duckOthers && anyPlayingView
    let shouldMixWithOthers = shouldMixOverride || (!anyPlayingView && !isNowPlayingEligible)

    if shouldMixWithOthers && !shouldDuckOthers && !doNotMixOverride {
      audioSessionCategoryOptions.insert(.mixWithOthers)
    } else {
      audioSessionCategoryOptions.remove(.mixWithOthers)
    }

    if shouldDuckOthers && !doNotMixOverride {
      audioSessionCategoryOptions.insert(.duckOthers)
    } else {
      audioSessionCategoryOptions.remove(.duckOthers)
    }

    if audioSession.categoryOptions != audioSessionCategoryOptions || audioSession
      .category != .playback || audioSession.mode != .moviePlayback
    {
      do {
        try audioSession.setCategory(
          .playback,
          mode: .moviePlayback,
          options: audioSessionCategoryOptions
        )
      } catch {
        log.warn("Failed to set audio session category")
      }
    }

    if anyPlayingView || doNotMixOverride {
      do {
        try audioSession.setActive(true)
      } catch {
        log.warn("Failed to set the audio session")
      }
    }
  }

  private func playerRequiresCategory(_ player: VLCMediaPlayer) -> Bool {
    guard let audio = player.audio else { return false }

    return player.isPlaying && audio.volume > MediaPlayerConstants.minPlayerVolume
  }

  private func findAudioMixingMode() -> AudioMixingMode? {
    let playingViews = expoViews.allObjects.filter { view in
      view.mediaPlayer?.isPlaying == true
    }

    var audioMixingMode: AudioMixingMode = .auto

    if playingViews.isEmpty {
      return nil
    }

    for view in playingViews
      where (audioMixingMode.priority()) < view.audioMixingMode.priority()
    {
      audioMixingMode = view.audioMixingMode
    }

    return audioMixingMode
  }
}
