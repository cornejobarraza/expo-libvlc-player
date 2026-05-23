import AVFoundation
import ExpoModulesCore
import Foundation
import VLCKit

class AudioSessionManager {
    static let shared = AudioSessionManager()

    private static let managerQueue = DispatchQueue(label: "audioManagerQueue")

    private lazy var expoViews = MediaPlayerManager.shared.expoViews

    func setAppropriateAudioSession() {
        Self.managerQueue.async { [weak self] in
            self?.setAudioSession()
        }
    }

    private func setAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        let audioMixingMode = findAudioMixingMode()
        var audioSessionCategoryOptions: AVAudioSession.CategoryOptions = audioSession.categoryOptions

        let anyPlayingView = expoViews.allObjects.contains { view in
            playerRequiresCategory(view.mediaPlayer)
        }

        let shouldMixOverride = audioMixingMode == .mixWithOthers
        let doNotMixOverride = audioMixingMode == .doNotMix
        let shouldDuckOthers = audioMixingMode == .duckOthers && anyPlayingView

        let shouldMixWithOthers = shouldMixOverride || !anyPlayingView

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

        if audioSession.categoryOptions != audioSessionCategoryOptions || audioSession.category != .playback || audioSession.mode != .moviePlayback {
            do {
                try audioSession.setCategory(.playback, mode: .moviePlayback, options: audioSessionCategoryOptions)
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

    private func playerRequiresCategory(_ mediaPlayer: VLCMediaPlayer?) -> Bool {
        guard let player = mediaPlayer, let audio = player.audio else { return false }
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

        for view in playingViews where (audioMixingMode.priority()) < view.audioMixingMode.priority() {
            audioMixingMode = view.audioMixingMode
        }

        return audioMixingMode
    }
}
