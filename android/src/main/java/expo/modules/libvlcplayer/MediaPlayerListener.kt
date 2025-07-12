package expo.modules.libvlcplayer

import org.videolan.libvlc.MediaPlayer.Event
import org.videolan.libvlc.MediaPlayer.EventListener

fun VlcPlayerView.setMediaPlayerListener() {
    mediaPlayer?.let { player ->
        player.setEventListener(
            EventListener { event ->
                when (event.type) {
                    Event.Buffering -> {
                        onBuffering(mapOf())
                    }

                    Event.Playing -> {
                        onPlaying(mapOf())
                        audioFocusManager.updateAudioFocus()

                        if (player.isSeekable()) {
                            val timestamp = time ?: DEFAULT_PLAYER_START

                            if (timestamp != DEFAULT_PLAYER_START) {
                                player.setTime(timestamp.toLong())
                                time = DEFAULT_PLAYER_START
                            }
                        }
                    }

                    Event.Paused -> {
                        onPaused(mapOf())
                        audioFocusManager.updateAudioFocus()
                    }

                    Event.Stopped -> {
                        onStopped(mapOf())
                        audioFocusManager.updateAudioFocus()

                        val position = 0f
                        onPositionChanged(mapOf("position" to position))
                    }

                    Event.EndReached -> {
                        onEnded(mapOf())
                        player.stop()

                        val userRepeat = options?.hasRepeatOptions() == false && repeat

                        if (userRepeat) {
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
