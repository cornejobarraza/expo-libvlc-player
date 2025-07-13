import MobileVLCKit

extension LibVlcPlayerView: VLCMediaPlayerDelegate {
    func mediaPlayerStateChanged(_: Notification) {
        guard let player = mediaPlayer else { return }

        switch player.state {
        case .buffering:
            onBuffering([:])
        case .playing:
            onPlaying([:])
            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()

            if player.isSeekable {
                let timestamp = time ?? defaultPlayerStart

                if timestamp != defaultPlayerStart {
                    player.time = VLCTime(int: Int32(timestamp))
                    time = defaultPlayerStart
                }
            }
        case .paused:
            onPaused([:])
            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        case .stopped:
            onStopped([:])
            MediaPlayerManager.shared.setAppropriateAudioSessionOrWarn()

            let position = 0.0
            onPositionChanged(["position": position])
        case .ended:
            onEnded([:])
            player.stop()

            let userRepeat = !options.hasRepeatOptions() && shouldRepeat

            if userRepeat {
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
