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

            if shouldInit {
                addPlayerSlaves()
                setPlayerTracks()

                if volume != maxPlayerVolume || mute {
                    let newVolume = mute ?
                        minPlayerVolume :
                        volume

                    player.audio?.volume = Int32(newVolume)
                }

                if rate != defaultPlayerRate {
                    player.rate = rate
                }

                if time != defaultPlayerTime {
                    player.time = VLCTime(int: Int32(time))
                }

                if scale != defaultPlayerScale {
                    player.scaleFactor = scale
                }

                if let aspectRatio = aspectRatio {
                    aspectRatio.withCString { cString in
                        player.videoAspectRatio = UnsafeMutablePointer(mutating: cString)
                    }
                }

                shouldInit = false
            }
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
