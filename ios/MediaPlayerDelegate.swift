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

                    onFirstPlay(getMediaInfo())

                    firstPlay = false
                }

                MediaPlayerManager.shared.activateKeepAwake()
                MediaPlayerManager.shared.setAppropriateAudioSession()
            case .paused:
                onPaused()

                MediaPlayerManager.shared.deactivateKeepAwake()
                MediaPlayerManager.shared.setAppropriateAudioSession()
            case .stopped:
                onStopped()

                MediaPlayerManager.shared.deactivateKeepAwake()
                MediaPlayerManager.shared.setAppropriateAudioSession()

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
                onEncounteredError(["error": "Media player encountered an error"])

                MediaPlayerManager.shared.deactivateKeepAwake()
                MediaPlayerManager.shared.setAppropriateAudioSession()

                firstPlay = true
                firstTime = true
            case .esAdded:
                onESAdded(getMediaTracks())
            default:
                break
            }
        }
    }

    func mediaPlayerTimeChanged(_: Notification) {
        if let player = mediaPlayer {
            onTimeChanged(["time": player.time.intValue])

            if firstTime {
                if mediaLength == 0 {
                    onFirstPlay(getMediaInfo())
                }

                setContentFit()

                MediaPlayerManager.shared.setAppropriateAudioSession()

                firstTime = false
            }

            onPositionChanged(["position": player.position])
        }
    }

    func mediaPlayerStartedRecording(_: VLCMediaPlayer) {
        let recording = Recording(
            path: nil,
            isRecording: true,
        )

        onRecordChanged(recording)
    }

    func mediaPlayer(_: VLCMediaPlayer, recordingStoppedAtPath path: String) {
        let recording = Recording(
            path: path,
            isRecording: false,
        )

        onRecordChanged(recording)
    }
}
