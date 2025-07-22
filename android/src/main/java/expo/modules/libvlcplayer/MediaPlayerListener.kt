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

                        if (player.getPosition() == 0f) {
                            setPlayerTracks()

                            if (time != DEFAULT_PLAYER_TIME) {
                                player.setTime(time.toLong())
                            }
                        }
                    }

                    Event.Playing -> {
                        onPlaying(mapOf())

                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.Paused -> {
                        onPaused(mapOf())

                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.Stopped -> {
                        onStopped(mapOf())

                        time = DEFAULT_PLAYER_TIME

                        val position = mapOf("position" to 0f)
                        onPositionChanged(position)

                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.EndReached -> {
                        onEndReached(mapOf())

                        player.stop()

                        val canRepeat = !options.hasRepeatOption() && repeat

                        if (canRepeat) {
                            player.play()
                        }
                    }

                    Event.EncounteredError -> {
                        val error = mapOf("error" to "Player encountered an error")
                        onEncounteredError(error)
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
