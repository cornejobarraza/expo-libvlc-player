import AVFoundation
import ExpoModulesCore
import Foundation
import MobileVLCKit

class MediaPlayerManager {
    static let shared = MediaPlayerManager()

    private static let managerQueue = DispatchQueue(label: "com.expo.libvlcplayer.manager.managerQueue")
    private let playerViews = NSHashTable<LibVlcPlayerView>.weakObjects()

    func onModuleDestroyed() {
        for view in playerViews.allObjects {
            view.destroyPlayer()
        }
    }

    func registerPlayerView(_ view: LibVlcPlayerView) {
        playerViews.add(view)
    }

    func unregisterPlayerView(_ view: LibVlcPlayerView) {
        playerViews.remove(view)
    }

    func onAppBackground() {
        for view in playerViews.allObjects {
            view.onBackground([:])

            if let player = view.mediaPlayer {
                let shouldPause = !view.playInBackground && player.isPlaying

                if shouldPause {
                    player.pause()
                }
            }
        }
    }

    func setAppropriateAudioSession() {
        Self.managerQueue.async { [weak self] in
            self?.setAudioSession()
        }
    }

    private func setAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        let audioMixingMode = findAudioMixingMode()
        var audioSessionCategoryOptions: AVAudioSession.CategoryOptions = audioSession.categoryOptions

        let isOutputtingAudio = playerViews.allObjects.contains { view in
            if let player = view.mediaPlayer, let audio = player.audio {
                return player.isPlaying && audio.volume > minPlayerVolume
            } else {
                return false
            }
        }

        let shouldMixOverride = audioMixingMode == .mixWithOthers
        let doNotMixOverride = audioMixingMode == .doNotMix
        let shouldDuckOthers = audioMixingMode == .duckOthers && isOutputtingAudio

        let shouldMixWithOthers = shouldMixOverride || !isOutputtingAudio

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

        if isOutputtingAudio || doNotMixOverride {
            do {
                try audioSession.setActive(true)
            } catch {
                log.warn("Failed to activate the audio session")
            }
        }
    }

    private func findAudioMixingMode() -> AudioMixingMode? {
        let playingViews = playerViews.allObjects.filter { view in
            view.mediaPlayer?.isPlaying == true
        }

        var audioMixingMode: AudioMixingMode = .auto

        if playingViews.isEmpty {
            return nil
        }

        for playerView in playingViews where (audioMixingMode.priority()) < playerView.audioMixingMode.priority() {
            audioMixingMode = playerView.audioMixingMode
        }

        return audioMixingMode
    }
}
