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

                        if (firstPlay) {
                            setupPlayer()
                        }

                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.Paused -> {
                        onPaused(mapOf())
                    }

                    Event.Stopped -> {
                        onStopped(mapOf())

                        detachPlayer()

                        firstPlay = true
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
