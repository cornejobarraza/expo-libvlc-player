package expo.modules.libvlcplayer

import expo.modules.libvlcplayer.records.Recording
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

                            onFirstPlay(getMediaInfo())

                            firstPlay = false
                        }

                        MediaPlayerManager.keepAwakeManager.activateKeepAwake()
                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.Paused -> {
                        onPaused(Unit)

                        MediaPlayerManager.keepAwakeManager.deactivateKeepAwake()
                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                    }

                    Event.Stopped -> {
                        onStopped(Unit)

                        detachPlayer()

                        MediaPlayerManager.keepAwakeManager.deactivateKeepAwake()
                        MediaPlayerManager.audioFocusManager.updateAudioFocus()

                        firstPlay = true
                        firstTime = true
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
                        onEncounteredError(mapOf("error" to "Media player encountered an error"))

                        MediaPlayerManager.keepAwakeManager.deactivateKeepAwake()
                        MediaPlayerManager.audioFocusManager.updateAudioFocus()

                        firstPlay = true
                        firstTime = true
                    }

                    Event.TimeChanged -> {
                        onTimeChanged(mapOf("time" to player.getTime().toInt()))

                        if (firstTime) {
                            if (mediaLength == 0L) {
                                onFirstPlay(getMediaInfo())
                            }

                            setContentFit()

                            MediaPlayerManager.audioFocusManager.updateAudioFocus()

                            firstTime = false
                        }
                    }

                    Event.PositionChanged -> {
                        onPositionChanged(mapOf("position" to player.getPosition()))
                    }

                    Event.ESAdded -> {
                        onESAdded(getMediaTracks())
                    }

                    Event.RecordChanged -> {
                        val recording =
                            Recording(
                                path = event.getRecordPath(),
                                isRecording = event.getRecording(),
                            )

                        onRecordChanged(recording)
                    }
                }
            },
        )
    }
}
