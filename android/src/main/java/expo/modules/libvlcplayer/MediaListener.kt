package expo.modules.libvlcplayer

import expo.modules.libvlcplayer.records.Track
import org.videolan.libvlc.interfaces.IMedia.Event
import org.videolan.libvlc.interfaces.IMedia.EventListener

fun LibVlcPlayerView.setMediaListener() {
    mediaPlayer?.let { player ->
        media?.setEventListener(
            EventListener { event ->
                when (event.type) {
                    Event.ParsedChanged -> {
                        val audioTracks = mutableListOf<Track>()
                        val audios = player.getAudioTracks()

                        audios?.forEach { track ->
                            val trackObj = Track(id = track.id, name = track.name)
                            audioTracks.add(trackObj)
                        }

                        val videoTracks = mutableListOf<Track>()
                        val videos = player.getVideoTracks()

                        videos?.forEach { track ->
                            val trackObj = Track(id = track.id, name = track.name)
                            videoTracks.add(trackObj)
                        }

                        val subtitleTracks = mutableListOf<Track>()
                        val subtitles = player.getSpuTracks()

                        subtitles?.forEach { track ->
                            val trackObj = Track(id = track.id, name = track.name)
                            subtitleTracks.add(trackObj)
                        }

                        val video = player.getCurrentVideoTrack()
                        val tracks =
                            mapOf(
                                "audio" to audioTracks,
                                "video" to videoTracks,
                                "subtitle" to subtitleTracks,
                            )
                        val pLength = player.getLength()
                        val length =
                            if (pLength != -1L) {
                                pLength
                            } else {
                                0L
                            }
                        val seekable = player.isSeekable()

                        val mediaInfo =
                            mapOf(
                                "width" to (video?.width ?: 0),
                                "height" to (video?.height ?: 0),
                                "tracks" to tracks,
                                "duration" to length.toDouble(),
                                "seekable" to seekable,
                            )

                        onParsedChanged(mediaInfo)

                        mediaLength = length
                    }
                }
            },
        )
    }
}
