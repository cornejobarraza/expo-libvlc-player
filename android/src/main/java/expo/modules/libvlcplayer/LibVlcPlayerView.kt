package expo.modules.libvlcplayer

import android.content.Context
import android.net.Uri
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.libvlcplayer.enums.AudioMixingMode
import expo.modules.libvlcplayer.records.MediaInfo
import expo.modules.libvlcplayer.records.MediaTracks
import expo.modules.libvlcplayer.records.Slave
import expo.modules.libvlcplayer.records.Track
import expo.modules.libvlcplayer.records.Tracks
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.interfaces.IMedia
import org.videolan.libvlc.util.DisplayManager
import org.videolan.libvlc.util.VLCVideoLayout

const val DEFAULT_PLAYER_RATE: Float = 1f
const val DEFAULT_PLAYER_TIME: Int = 0
const val DEFAULT_PLAYER_SCALE: Float = 0f

const val MIN_PLAYER_VOLUME: Int = 0
const val MAX_PLAYER_VOLUME: Int = 100
const val PLAYER_VOLUME_STEP: Int = 10

private val DISPLAY_MANAGER: DisplayManager? = null
private val ENABLE_SUBTITLES: Boolean = true
private val USE_TEXTURE_VIEW: Boolean = true

class LibVlcPlayerView(
    context: Context,
    appContext: AppContext,
) : ExpoView(context, appContext) {
    private val playerView: VLCVideoLayout = VLCVideoLayout(context)

    private var libVLC: LibVLC? = null
    internal var mediaPlayer: MediaPlayer? = null
    internal var media: Media? = null
    private var shouldCreate: Boolean = false

    internal var mediaLength: Long = 0L
    internal var userVolume: Int = MAX_PLAYER_VOLUME
    internal var firstPlay: Boolean = false

    internal val onBuffering by EventDispatcher()
    internal val onPlaying by EventDispatcher()
    internal val onPaused by EventDispatcher()
    internal val onStopped by EventDispatcher()
    internal val onEndReached by EventDispatcher()
    internal val onEncounteredError by EventDispatcher()
    internal val onPositionChanged by EventDispatcher()
    internal val onESAdded by EventDispatcher<MediaTracks>()
    internal val onFirstPlay by EventDispatcher<MediaInfo>()
    internal val onBackground by EventDispatcher()

    init {
        MediaPlayerManager.registerPlayerView(this)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()

        attachPlayer()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()

        detachPlayer()
    }

    fun createPlayer() {
        if (!shouldCreate) {
            return
        }

        destroyPlayer()
        libVLC = LibVLC(context, options)
        mediaPlayer = MediaPlayer(libVLC)
        setMediaPlayerListener()

        try {
            media = Media(libVLC, Uri.parse(source))
            mediaPlayer!!.setMedia(media)
            media!!.release()
        } catch (_: Exception) {
            val error = mapOf("error" to "Invalid source, media could not be set")
            onEncounteredError(error)
        }

        addPlayerSlaves()

        if (autoplay) {
            mediaPlayer!!.play()
        }

        shouldCreate = false
        firstPlay = true
    }

    fun attachPlayer() {
        mediaPlayer?.let { player ->
            if (playerView.getParent() == null) {
                addView(playerView)
            }

            if (!player.getVLCVout().areViewsAttached()) {
                player.attachViews(playerView, DISPLAY_MANAGER, ENABLE_SUBTITLES, USE_TEXTURE_VIEW)
            }
        }
    }

    fun detachPlayer() {
        mediaPlayer?.detachViews()
        removeAllViews()
    }

    fun destroyPlayer() {
        media?.release()
        media = null
        mediaPlayer?.release()
        mediaPlayer = null
        libVLC?.release()
        libVLC = null
    }

    fun getMediaTracks(): MediaTracks {
        var mediaTracks = MediaTracks()

        mediaPlayer?.let { player ->
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

            mediaTracks =
                MediaTracks(
                    audio = audioTracks,
                    video = videoTracks,
                    subtitle = subtitleTracks,
                )
        }

        return mediaTracks
    }

    fun setPlayerTracks() {
        mediaPlayer?.let { player ->
            val audioTrack = tracks?.audio ?: player.getAudioTrack()
            val videoTrack = tracks?.video ?: player.getVideoTrack()
            val spuTrack = tracks?.subtitle ?: player.getSpuTrack()

            player.setAudioTrack(audioTrack)
            player.setVideoTrack(videoTrack)
            player.setSpuTrack(spuTrack)
        }
    }

    fun addPlayerSlaves() {
        slaves.forEach { slave ->
            val type = slave.type
            val slaveType =
                if (type == "subtitle") {
                    IMedia.Slave.Type.Subtitle
                } else {
                    IMedia.Slave.Type.Audio
                }
            val source = slave.source
            val selected = slave.selected ?: false

            try {
                mediaPlayer?.addSlave(slaveType, Uri.parse(source), selected)
            } catch (_: Exception) {
                val error = mapOf("error" to "Invalid slave, $type could not be added")
                onEncounteredError(error)
            }
        }
    }

    fun getMediaInfo(): MediaInfo {
        var mediaInfo = MediaInfo()

        mediaPlayer?.let { player ->
            val video = player.getCurrentVideoTrack()
            val pLength = player.getLength()
            val length =
                if (pLength != -1L) {
                    pLength
                } else {
                    0L
                }
            val seekable = player.isSeekable()
            val mediaTracks = getMediaTracks()

            mediaInfo =
                MediaInfo(
                    width = video?.width ?: 0,
                    height = video?.height ?: 0,
                    length = length.toDouble(),
                    seekable = seekable,
                    tracks = mediaTracks,
                )

            mediaLength = length
        }

        return mediaInfo
    }

    fun setupPlayer() {
        mediaPlayer?.let { player ->
            attachPlayer()
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

            time = DEFAULT_PLAYER_TIME
        }
    }

    var source: String? = null
        set(value) {
            val old = field
            field = value

            if (value != null) {
                shouldCreate = value != old
            } else {
                destroyPlayer()
            }
        }

    var options: ArrayList<String> = ArrayList<String>()
        set(value) {
            val old = field
            field = value

            if (source != null) {
                shouldCreate = value != old
            }
        }

    var tracks: Tracks? = null
        set(value) {
            field = value
            setPlayerTracks()
        }

    var slaves: ArrayList<Slave> = ArrayList<Slave>()
        set(value) {
            val old = field
            field = value

            if (value != old) {
                addPlayerSlaves()
            }
        }

    var scale: Float = DEFAULT_PLAYER_SCALE
        set(value) {
            field = value
            mediaPlayer?.setScale(value)
        }

    var aspectRatio: String? = null
        set(value) {
            field = value
            mediaPlayer?.setAspectRatio(value)
        }

    var rate: Float = DEFAULT_PLAYER_RATE
        set(value) {
            field = value
            mediaPlayer?.setRate(value)
        }

    var time: Int = DEFAULT_PLAYER_TIME

    var volume: Int = MAX_PLAYER_VOLUME
        set(value) {
            field = value

            if (options.hasAudioOption()) {
                val error = mapOf("error" to "Audio disabled via options")
                onEncounteredError(error)
            }

            val newVolume = value.coerceIn(MIN_PLAYER_VOLUME, MAX_PLAYER_VOLUME)
            userVolume = newVolume

            mediaPlayer?.let { player ->
                if (player.getVolume() > MIN_PLAYER_VOLUME) {
                    player.setVolume(newVolume)
                }
            }
        }

    var mute: Boolean = false
        set(value) {
            field = value

            if (options.hasAudioOption() && !value) {
                val error = mapOf("error" to "Audio disabled via options")
                onEncounteredError(error)
            }

            val newVolume =
                if (value) {
                    MIN_PLAYER_VOLUME
                } else {
                    userVolume
                }

            mediaPlayer?.setVolume(newVolume)
            MediaPlayerManager.audioFocusManager.updateAudioFocus()
        }

    var audioMixingMode: AudioMixingMode = AudioMixingMode.AUTO
        set(value) {
            field = value
            MediaPlayerManager.audioFocusManager.updateAudioFocus()
        }

    var playInBackground: Boolean = false
        set(value) {
            field = value
            MediaPlayerManager.audioFocusManager.updateAudioFocus()
        }

    var autoplay: Boolean = true

    var repeat: Boolean = false
        set(value) {
            field = value

            if (options.hasRepeatOption()) {
                val error = mapOf("error" to "Repeat enabled via options")
                onEncounteredError(error)
            }
        }

    fun play() {
        mediaPlayer?.play()
    }

    fun pause() {
        mediaPlayer?.pause()
    }

    fun stop() {
        mediaPlayer?.stop()
    }

    fun seek(position: Float) {
        mediaPlayer?.let { player ->
            if (player.isSeekable()) {
                player.setPosition(position)
            } else {
                val time = position * mediaLength.toFloat()
                this.time = time.toInt()
            }
        }
    }

    internal fun ArrayList<String>.hasAudioOption(): Boolean {
        val options =
            setOf(
                "--no-audio",
                "-no-audio",
                ":no-audio",
            )

        return this.any { it in options }
    }

    internal fun ArrayList<String>.hasRepeatOption(): Boolean {
        val options =
            setOf(
                "--input-repeat=",
                "-input-repeat=",
                ":input-repeat=",
            )

        return this.any { arg ->
            options.any { option ->
                arg.startsWith(option)
            }
        }
    }
}
