#if os(tvOS)
    import TVVLCKit
#else
    import MobileVLCKit
#endif

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
                firstTime = true
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
                firstTime = true
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

            if firstTime {
                if mediaLength == 0 {
                    let mediaInfo = getMediaInfo()

                    // MediaInfo fallback
                    onFirstPlay(mediaInfo)
                }

                firstTime = false
            }

            let position = ["position": player.position]

            onPositionChanged(position)
        }
    }
}
