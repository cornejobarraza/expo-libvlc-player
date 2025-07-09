import AVFoundation
import ExpoModulesCore
import Foundation

class VlcPlayerManager {
    static var shared = VlcPlayerManager()

    private static var managerQueue = DispatchQueue(label: "com.expo.libvlcplayer.manager.managerQueue")
    private var views = NSHashTable<VlcPlayerView>.weakObjects()

    func registerView(view: VlcPlayerView) {
        views.add(view)
    }

    func unregisterView(view: VlcPlayerView) {
        views.remove(view)
    }

    func onAppDestroyed() {
        for view in views.allObjects {
            view.destroyPlayer()
        }
    }

    func onAppForegrounded() {
        for view in views.allObjects {
            view.isBackgrounded = false
        }
    }

    func onAppBackgrounded() {
        for view in views.allObjects {
            view.isBackgrounded = true

            guard let player = view.mediaPlayer else { continue }

            if !view.playInBackground, player.isPlaying {
                player.pause()
            }
        }
    }

    func setAppropriateAudioSessionOrWarn() {
        Self.managerQueue.async { [weak self] in
            self?.setAudioSession()
        }
    }

    private func setAudioSession() {
        let audioSession = AVAudioSession.sharedInstance()
        let audioMixingMode = findAudioMixingMode()
        var audioSessionCategoryOptions: AVAudioSession.CategoryOptions = audioSession.categoryOptions

        let isOutputtingAudio = views.allObjects.contains { view in
            if let isPlaying = view.mediaPlayer?.isPlaying,
               let isMuted = view.mediaPlayer?.audio?.isMuted
            {
                if isPlaying, !isMuted {
                    return true
                }
            }

            return false
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
        let playingViews = views.allObjects.filter { view in
            if let isPlaying = view.mediaPlayer?.isPlaying, isPlaying {
                return true
            }

            return false
        }

        var audioMixingMode: AudioMixingMode = .mixWithOthers

        if playingViews.isEmpty {
            return nil
        }

        for playerView in playingViews where (audioMixingMode.priority()) < playerView.audioMixingMode.priority() {
            audioMixingMode = playerView.audioMixingMode
        }

        return audioMixingMode
    }
}
