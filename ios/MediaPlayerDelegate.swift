import MobileVLCKit

extension LibVlcPlayerView: VLCMediaPlayerDelegate {
    func mediaPlayerStateChanged(_: Notification) {
        if let player = mediaPlayer {
            switch player.state {
            case .buffering:
                onBuffering()
            case .playing:
                onPlaying()

                if firstPlay {
                    setupPlayer()

                    let mediaInfo = getMediaInfo()

                    onFirstPlay(mediaInfo)

                    firstPlay = false
                }

                MediaPlayerManager.shared.setAppropriateAudioSession()
            case .paused:
                onPaused()

                MediaPlayerManager.shared.setAppropriateAudioSession()
            case .stopped:
                onStopped()

                firstPlay = true
                firstPosition = true
            case .ended:
                onEndReached()

                player.stop()

                let shouldReplay = !options.hasRepeatOption() && shouldRepeat

                if shouldReplay {
                    player.play()
                }
            case .error:
                let error = ["error": "Media player encountered an error"]

                onEncounteredError(error)

                firstPlay = true
                firstPosition = true
            case .esAdded:
                let mediaTracks = getMediaTracks()

                onESAdded(mediaTracks)
            default:
                break
            }
        }
    }

    func mediaPlayerTimeChanged(_: Notification) {
        if let player = mediaPlayer {
            let time = ["time": player.time.intValue]

            onTimeChanged(time)

            let position = ["position": player.position]

            onPositionChanged(position)

            if firstPosition {
                if mediaLength == 0 {
                    let mediaInfo = getMediaInfo()

                    onFirstPlay(mediaInfo)
                }

                firstPosition = false
            }
        }
    }
}
