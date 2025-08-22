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

                let mediaInfo = getMediaInfo()

                onFirstPlay(mediaInfo)

                firstPlay = false
            }

            MediaPlayerManager.shared.setAppropriateAudioSession()
        case .paused:
            onPaused([:])
        case .stopped:
            onStopped([:])

            firstPlay = true
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
        case .esAdded:
            if !firstPlay {
                let mediaTracks = getMediaTracks()
                onESAdded(mediaTracks)
            }
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
