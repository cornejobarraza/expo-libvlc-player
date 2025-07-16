import AVFoundation
import ExpoModulesCore
import Foundation
import MobileVLCKit

class MediaPlayerManager {
    static var shared = MediaPlayerManager()

    private static var managerQueue = DispatchQueue(label: "com.expo.libvlcplayer.manager.managerQueue")
    private var views = NSHashTable<LibVlcPlayerView>.weakObjects()

    func registerView(view: LibVlcPlayerView) {
        views.add(view)
        setAppropriateAudioSessionOrWarn()
    }

    func unregisterView(view: LibVlcPlayerView) {
        view.destroyPlayer()
        views.remove(view)
        setAppropriateAudioSessionOrWarn()
    }

    func onAppForegrounded() {
        for view in views.allObjects {
            guard let player = view.mediaPlayer else { continue }

            player.drawable = view.playerView

            if player.isPlaying {
                let background = ["background": false]
                view.onBackground(background)
            } else {
                let time = player.time.intValue

                if time != 0 {
                    player.time = VLCTime(int: Int32(time))
                }
            }
        }
    }

    func onAppBackgrounded() {
        for view in views.allObjects {
            let background = ["background": true]
            view.onBackground(background)

            guard let player = view.mediaPlayer else { continue }

            if !view.playInBackground, player.isPlaying {
                player.pause()
            }

            player.drawable = nil
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
