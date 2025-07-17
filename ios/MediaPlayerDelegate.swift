import MobileVLCKit

extension LibVlcPlayerView: VLCMediaPlayerDelegate {
    func mediaPlayerStateChanged(_: Notification) {
        guard let player = mediaPlayer else { return }

        switch player.state {
        case .buffering:
            onBuffering([:])
        case .playing:
            onPlaying([:])

            if player.position == 0.0 {
                setPlayerTracks()

                if player.isSeekable, time != defaultPlayerStart {
                    player.time = VLCTime(int: Int32(time))
                }
            }

            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        case .paused:
            onPaused([:])

            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        case .stopped:
            onStopped([:])

            let position = ["position": 0.0]
            onPositionChanged(position)

            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        case .ended:
            onEnded([:])
            player.stop()

            let canRepeat = !options.hasRepeatOption() && shouldRepeat

            if canRepeat {
                onRepeat([:])
                player.play()
            }
        case .error:
            let error = ["error": "Player encountered an error"]
            onError(error)
        default:
            break
        }
    }

    func mediaPlayerTimeChanged(_: Notification) {
        guard let player = mediaPlayer else { return }

        let position = ["position": player.position]
        onPositionChanged(position)
    }
}
