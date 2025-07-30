import MobileVLCKit

extension LibVlcPlayerView: VLCMediaPlayerDelegate {
    func mediaPlayerStateChanged(_: Notification) {
        guard let player = mediaPlayer else { return }

        switch player.state {
        case .buffering:
            onBuffering([:])

            if player.position == 0.0 {
                if time != defaultPlayerTime {
                    player.time = VLCTime(int: Int32(time))
                    time = defaultPlayerTime
                }

                setPlayerTracks()
            }
        case .playing:
            onPlaying([:])

            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        case .paused:
            onPaused([:])

            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        case .stopped:
            onStopped([:])

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
