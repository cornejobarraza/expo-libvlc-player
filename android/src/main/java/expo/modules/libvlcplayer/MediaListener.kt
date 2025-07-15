package expo.modules.libvlcplayer

import com.facebook.react.bridge.Arguments
import org.videolan.libvlc.interfaces.IMedia.Event
import org.videolan.libvlc.interfaces.IMedia.EventListener

fun LibVlcPlayerView.setMediaListener() {
    mediaPlayer?.let { player ->
        media?.setEventListener(
            EventListener { event ->
                when (event.type) {
                    Event.ParsedChanged -> {
                        val videoTracks = Arguments.createArray()

                        if (player.getVideoTracksCount() > 0) {
                            val videos = player.getVideoTracks()

                            videos.forEach { track ->
                                val trackMap = Arguments.createMap()
                                trackMap.putInt("id", track.id)
                                trackMap.putString("name", track.name)
                                videoTracks.pushMap(trackMap)
                            }
                        }

                        val audioTracks = Arguments.createArray()

                        if (player.getAudioTracksCount() > 0) {
                            val audios = player.getAudioTracks()

                            audios.forEach { track ->
                                val trackMap = Arguments.createMap()
                                trackMap.putInt("id", track.id)
                                trackMap.putString("name", track.name)
                                audioTracks.pushMap(trackMap)
                            }
                        }

                        val subtitleTracks = Arguments.createArray()

                        if (player.getSpuTracksCount() > 0) {
                            val subtitles = player.getSpuTracks()

                            subtitles.forEach { track ->
                                val trackMap = Arguments.createMap()
                                trackMap.putInt("id", track.id)
                                trackMap.putString("name", track.name)
                                subtitleTracks.pushMap(trackMap)
                            }
                        }

                        val video = player.getCurrentVideoTrack()
                        val ratio = player.getAspectRatio()
                        val length = player.getLength()
                        val tracks =
                            Arguments.createMap().apply {
                                putArray("video", videoTracks)
                                putArray("audio", audioTracks)
                                putArray("subtitle", subtitleTracks)
                            }
                        val seekable = player.isSeekable()

                        val videoInfo =
                            Arguments.createMap().apply {
                                putInt("width", video?.width ?: 0)
                                putInt("height", video?.height ?: 0)
                                putString("aspectRatio", ratio)
                                putDouble("duration", length.toDouble())
                                putMap("tracks", tracks)
                                putBoolean("seekable", seekable)
                            }

                        onLoad(videoInfo)
                    }
                }
            },
        )
    }
}
