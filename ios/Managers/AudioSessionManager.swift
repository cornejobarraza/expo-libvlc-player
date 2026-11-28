import AVFoundation
import VLCKit

class AudioSessionManager {
  private static let managerQueue = DispatchQueue(label: "audioManagerQueue")

  private lazy var expoViews = MediaPlayerManager.shared.expoViews

  func setAppropriateAudioSession() {
    let playingViews = expoViews.allObjects.filter { view in view.mediaPlayer?.isPlaying == true }
    let audioMixingMode = playingViews.map(\.audioMixingMode)
      .max { lhs, rhs in lhs.priority < rhs.priority }
    let anyPlayingView = playingViews
      .contains { view in (view.mediaPlayer?.audio?.volume ?? 0) > 0 }
    let isNowPlayingEligible = MediaPlayerManager.shared.mediaPlaybackManager.isNowPlayingEligible

    Self.managerQueue.async {
      Self.setAudioSession(audioMixingMode, anyPlayingView, isNowPlayingEligible)
    }
  }

  private static func setAudioSession(
    _ audioMixingMode: AudioMixingMode?,
    _ anyPlayingView: Bool,
    _ isNowPlayingEligible: Bool
  ) {
    let audioSession = AVAudioSession.sharedInstance()
    var audioSessionCategoryOptions: AVAudioSession.CategoryOptions = audioSession
      .categoryOptions

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
        // Failed to set audio session category
      }
    }

    if anyPlayingView || doNotMixOverride {
      do {
        try audioSession.setActive(true)
      } catch {
        // Failed to set the audio session
      }
    }
  }
}
