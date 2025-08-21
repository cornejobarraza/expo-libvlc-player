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
                            attachPlayer()

                            setupPlayer()

                            val mediaInfo = getMediaInfo()

                            onFirstPlay(mediaInfo)

                            firstPlay = false
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

                    Event.ESAdded -> {
                        val mediaTracks = getMediaTracks()
                        onESAdded(mediaTracks)
                    }
                }
            },
        )
    }
}
