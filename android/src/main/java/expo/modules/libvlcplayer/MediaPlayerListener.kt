package expo.modules.libvlcplayer

import org.videolan.libvlc.MediaPlayer.Event
import org.videolan.libvlc.MediaPlayer.EventListener

fun LibVlcPlayerView.setMediaPlayerListener() {
    mediaPlayer?.let { player ->
        player.setEventListener(
            EventListener { event ->
                when (event.type) {
                    Event.Buffering -> {
                        onBuffering(Unit)
                    }

                    Event.Playing -> {
                        onPlaying(Unit)

                        if (firstPlay) {
                            attachPlayer()

                            setupPlayer()

                            val mediaInfo = getMediaInfo()

                            onFirstPlay(mediaInfo)

                            firstPlay = false
                        }

                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.Paused -> {
                        onPaused(Unit)
                    }

                    Event.Stopped -> {
                        onStopped(Unit)

                        detachPlayer()

                        firstPlay = true
                        firstPosition = true
                    }

                    Event.EndReached -> {
                        onEndReached(Unit)

                        player.stop()

                        val shouldReplay = !options.hasRepeatOption() && repeat

                        if (shouldReplay) {
                            player.play()
                        }
                    }

                    Event.EncounteredError -> {
                        val error = mapOf("error" to "Media player encountered an error")

                        onEncounteredError(error)

                        firstPlay = true
                        firstPosition = true
                    }

                    Event.TimeChanged -> {
                        val time = mapOf("time" to player.getTime().toInt())

                        onTimeChanged(time)
                    }

                    Event.PositionChanged -> {
                        val position = mapOf("position" to player.getPosition())

                        onPositionChanged(position)

                        if (firstPosition) {
                            if (mediaLength == 0L) {
                                val mediaInfo = getMediaInfo()

                                onFirstPlay(mediaInfo)
                            }

                            firstPosition = false
                        }
                    }

                    Event.ESAdded -> {
                        if (!firstPlay) {
                            val mediaTracks = getMediaTracks()

                            onESAdded(mediaTracks)
                        }
                    }
                }
            },
        )
    }
}
