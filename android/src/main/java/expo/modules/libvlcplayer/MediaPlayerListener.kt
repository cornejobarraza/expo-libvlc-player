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

                        if (player.getPosition() == 0f) {
                            setPlayerTracks()

                            if (player.isSeekable() && time != DEFAULT_PLAYER_START) {
                                player.setTime(time.toLong())
                            }
                        }

                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.Paused -> {
                        onPaused(mapOf())

                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.Stopped -> {
                        onStopped(mapOf())

                        val position = mapOf("position" to 0f)
                        onPositionChanged(position)

                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.EndReached -> {
                        onEnded(mapOf())
                        player.stop()

                        val canRepeat = !options.hasRepeatOption() && repeat

                        if (canRepeat) {
                            onRepeat(mapOf())
                            player.play()
                        }
                    }

                    Event.EncounteredError -> {
                        val error = mapOf("error" to "Player encountered an error")
                        onError(error)
                    }

                    Event.PositionChanged -> {
                        val position = mapOf("position" to event.positionChanged)
                        onPositionChanged(position)
                    }
                }
            },
        )
    }
}
