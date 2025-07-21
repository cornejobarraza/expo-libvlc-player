import MobileVLCKit

extension LibVlcPlayerView: VLCMediaPlayerDelegate {
    func mediaPlayerStateChanged(_: Notification) {
        guard let player = mediaPlayer else { return }

        switch player.state {
        case .buffering:
            onBuffering([:])

            if player.position == 0.0 {
                setPlayerTracks()

                if player.isSeekable, time != defaultPlayerStart {
                    player.time = VLCTime(int: Int32(time))
                }
            }
        case .playing:
            onPlaying([:])

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
            onEndReached([:])

            player.stop()

            let canRepeat = !options.hasRepeatOption() && shouldRepeat

            if canRepeat {
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
