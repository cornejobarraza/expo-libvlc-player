package expo.modules.libvlcplayer

import android.content.Context
import android.net.Uri
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.libvlcplayer.enums.AudioMixingMode
import expo.modules.libvlcplayer.records.MediaInfo
import expo.modules.libvlcplayer.records.Slave
import expo.modules.libvlcplayer.records.Tracks
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.interfaces.IMedia
import org.videolan.libvlc.util.DisplayManager
import org.videolan.libvlc.util.VLCVideoLayout
import java.util.UUID

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
    internal val playerViewId: String = UUID.randomUUID().toString()

    private val playerView: VLCVideoLayout =
        VLCVideoLayout(context).also {
            addView(it)
        }

    private var libVLC: LibVLC? = null
    internal var mediaPlayer: MediaPlayer? = null
    internal var media: Media? = null
    private var shouldCreate: Boolean = false
    internal var shouldSetup: Boolean = true

    internal var mediaLength: Long = 0L
    internal var userVolume: Int = MAX_PLAYER_VOLUME

    internal val onBuffering by EventDispatcher()
    internal val onPlaying by EventDispatcher()
    internal val onPaused by EventDispatcher()
    internal val onStopped by EventDispatcher()
    internal val onEndReached by EventDispatcher()
    internal val onEncounteredError by EventDispatcher()
    internal val onPositionChanged by EventDispatcher()
    internal val onParsedChanged by EventDispatcher<MediaInfo>()
    internal val onBackground by EventDispatcher()

    init {
        MediaPlayerManager.registerPlayerView(this)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()

        mediaPlayer?.attachViews(playerView, DISPLAY_MANAGER, ENABLE_SUBTITLES, USE_TEXTURE_VIEW)
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()

        mediaPlayer?.detachViews()
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
            setMediaListener()
        } catch (_: Exception) {
            val error = mapOf("error" to "Invalid source, media could not be set")
            onEncounteredError(error)
        }

        addPlayerSlaves()

        if (autoplay) {
            mediaPlayer!!.play()
        }

        shouldCreate = false
        shouldSetup = true
    }

    fun destroyPlayer() {
        media?.release()
        media = null
        mediaPlayer?.release()
        mediaPlayer = null
        libVLC?.release()
        libVLC = null
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
            } else {
                destroyPlayer()
            }
        }

    fun addPlayerSlave(slave: Slave) {
        val type = slave.type
        val slaveType =
            if (type == "subtitle") {
                IMedia.Slave.Type.Subtitle
            } else {
                IMedia.Slave.Type.Audio
            }
        val source = slave.source
        val selected = false

        try {
            mediaPlayer?.addSlave(slaveType, Uri.parse(source), selected)
        } catch (_: Exception) {
            val error = mapOf("error" to "Invalid slave, $type could not be added")
            onEncounteredError(error)
        }
    }

    fun addPlayerSlaves() {
        // Add in this specific order, otherwise subtitle slaves will be missing
        slaves?.filter { it.type == "subtitle" }?.forEach(::addPlayerSlave)
        slaves?.filter { it.type == "audio" }?.forEach(::addPlayerSlave)
    }

    var slaves: ArrayList<Slave>? = null
        set(value) {
            field = value
            addPlayerSlaves()
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

    var tracks: Tracks? = null
        set(value) {
            if (options.hasAudioTrackOption()) {
                val error = mapOf("error" to "Audio track selected via options")
                onEncounteredError(error)
            }

            if (options.hasSubtitleTrackOption()) {
                val error = mapOf("error" to "Subtitle track selected via options")
                onEncounteredError(error)
            }

            field = value
            setPlayerTracks()
        }

    var volume: Int = MAX_PLAYER_VOLUME
        set(value) {
            if (options.hasAudioOption()) {
                val error = mapOf("error" to "Audio disabled via options")
                onEncounteredError(error)
            }

            field = value

            val volume = value.coerceIn(MIN_PLAYER_VOLUME, MAX_PLAYER_VOLUME)
            userVolume = volume

            mediaPlayer?.setVolume(volume)
            MediaPlayerManager.audioFocusManager.updateAudioFocus()
        }

    var mute: Boolean = false
        set(value) {
            if (options.hasAudioOption()) {
                val error = mapOf("error" to "Audio disabled via options")
                onEncounteredError(error)
            }

            field = value

            val newVolume =
                if (!value) {
                    userVolume.coerceIn(PLAYER_VOLUME_STEP, MAX_PLAYER_VOLUME)
                } else {
                    MIN_PLAYER_VOLUME
                }

            mediaPlayer?.setVolume(newVolume)
            MediaPlayerManager.audioFocusManager.updateAudioFocus()
        }

    var rate: Float = DEFAULT_PLAYER_RATE
        set(value) {
            field = value
            mediaPlayer?.setRate(value)
        }

    var time: Int = DEFAULT_PLAYER_TIME

    var repeat: Boolean = false
        set(value) {
            if (options.hasRepeatOption()) {
                val error = mapOf("error" to "Repeat enabled via options")
                onEncounteredError(error)
            }

            field = value
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

    internal fun ArrayList<String>.hasAudioTrackOption(): Boolean {
        val options =
            setOf(
                "--audio-track=",
                "-audio-track=",
                ":audio-track=",
            )

        return this.any { arg ->
            options.any { option ->
                arg.startsWith(option)
            }
        }
    }

    internal fun ArrayList<String>.hasSubtitleTrackOption(): Boolean {
        val options =
            setOf(
                "--sub-track=",
                "-sub-track=",
                ":sub-track=",
            )

        return this.any { arg ->
            options.any { option ->
                arg.startsWith(option)
            }
        }
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
