package expo.modules.libvlcplayer

import org.videolan.libvlc.MediaPlayer.Event
import org.videolan.libvlc.MediaPlayer.EventListener

fun LibVlcPlayerView.setMediaPlayerListener() {
    mediaPlayer?.let { player ->
        player.setEventListener(
            EventListener { event ->
                when (event.type) {
                    Event.Buffering -> {
                        onBuffering(mapOf())
                    }

                    Event.Playing -> {
                        onPlaying(mapOf())

                        MediaPlayerManager.audioFocusManager.updateAudioFocus()

                        if (shouldInit) {
                            addPlayerSlaves()
                            setPlayerTracks()

                            if (volume != MAX_PLAYER_VOLUME || mute) {
                                val newVolume =
                                    if (mute) {
                                        MIN_PLAYER_VOLUME
                                    } else {
                                        volume
                                    }

                                player.setVolume(newVolume)
                            }

                            if (rate != DEFAULT_PLAYER_RATE) {
                                player.setRate(rate)
                            }

                            if (time != DEFAULT_PLAYER_TIME) {
                                player.setTime(time.toLong())
                            }

                            if (scale != DEFAULT_PLAYER_SCALE) {
                                player.setScale(scale)
                            }

                            if (aspectRatio != null) {
                                player.setAspectRatio(aspectRatio)
                            }

                            shouldInit = false
                        }
                    }

                    Event.Paused -> {
                        onPaused(mapOf())

                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.Stopped -> {
                        onStopped(mapOf())

                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.EndReached -> {
                        onEndReached(mapOf())

                        player.stop()

                        val shouldReplay = !options.hasRepeatOption() && repeat

                        if (shouldReplay) {
                            player.play()
                        }
                    }

                    Event.EncounteredError -> {
                        val error = mapOf("error" to "Player encountered an error")
                        onEncounteredError(error)
                    }

                    Event.PositionChanged -> {
                        val position = mapOf("position" to player.getPosition())
                        onPositionChanged(position)
                    }
                }
            },
        )
    }
}
