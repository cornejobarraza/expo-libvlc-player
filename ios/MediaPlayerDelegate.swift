import MobileVLCKit

extension LibVlcPlayerView: VLCMediaPlayerDelegate {
    func mediaPlayerStateChanged(_: Notification) {
        guard let player = mediaPlayer else { return }

        switch player.state {
        case .buffering:
            onBuffering([:])
        case .playing:
            onPlaying([:])

            if firstPlay {
                setupPlayer()
            }

            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        case .paused:
            onPaused([:])

            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        case .stopped:
            onStopped([:])

            firstPlay = true

            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        case .ended:
            onEndReached([:])

            player.stop()

            let shouldReplay = !options.hasRepeatOption() && shouldRepeat

            if shouldReplay {
                player.play()
            }
        case .error:
            let error = ["error": "Player encountered an error"]
            onEncounteredError(error)
        default:
            break
        }
    }

    func mediaPlayerTimeChanged(_: Notification) {
        let position = ["position": mediaPlayer?.position]
        onPositionChanged(position)
    }
}
