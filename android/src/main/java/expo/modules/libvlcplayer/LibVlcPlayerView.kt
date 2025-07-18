package expo.modules.libvlcplayer

import android.content.Context
import android.net.Uri
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.libvlcplayer.enums.AudioMixingMode
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.interfaces.IMedia
import org.videolan.libvlc.util.VLCVideoLayout
import java.util.UUID

const val DEFAULT_PLAYER_RATE: Float = 1f
const val DEFAULT_PLAYER_START: Int = 0
const val MIN_PLAYER_VOLUME: Int = 0
const val MAX_PLAYER_VOLUME: Int = 100
const val PLAYER_VOLUME_STEP: Int = 10

private val ENABLE_SUBTITLES = true
private val USE_TEXTURE_VIEW = false

class LibVlcPlayerView(
    context: Context,
    appContext: AppContext,
) : ExpoView(context, appContext) {
    internal val playerViewId: String = UUID.randomUUID().toString()

    private val playerView: VLCVideoLayout = VLCVideoLayout(context)

    private var libVLC: LibVLC? = null
    internal var mediaPlayer: MediaPlayer? = null
    internal var media: Media? = null
    private var shouldCreate: Boolean = false

    internal var userVolume: Int = MAX_PLAYER_VOLUME
    internal var repeat: Boolean = false
    private var autoplay: Boolean = true

    internal val onBuffering by EventDispatcher()
    internal val onPlaying by EventDispatcher()
    internal val onPaused by EventDispatcher()
    internal val onStopped by EventDispatcher()
    internal val onEnded by EventDispatcher()
    internal val onRepeat by EventDispatcher()
    internal val onError by EventDispatcher()
    internal val onPositionChanged by EventDispatcher()
    internal val onLoad by EventDispatcher<WritableMap>()
    internal val onBackground by EventDispatcher()

    init {
        MediaPlayerManager.registerView(this)

        addView(playerView)
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
            media = Media(libVLC, Uri.parse(uri))
            mediaPlayer!!.setMedia(media)
            setMediaListener()
            attachPlayer()
        } catch (_: Exception) {
            val error = mapOf("error" to "Invalid URI, media could not be set")
            onError(error)
        }

        addPlayerSlaves()

        if (autoplay) {
            mediaPlayer!!.play()
        }

        shouldCreate = false
    }

    fun attachPlayer() {
        mediaPlayer?.attachViews(playerView, null, ENABLE_SUBTITLES, USE_TEXTURE_VIEW)
    }

    fun detachPlayer() {
        mediaPlayer?.detachViews()
    }

    fun destroyPlayer() {
        media?.release()
        mediaPlayer?.stop()
        mediaPlayer?.release()
        libVLC?.release()
    }

    var uri: String = ""
        set(value) {
            val old = field
            field = value

            shouldCreate = value != old
        }

    var options: ArrayList<String> = ArrayList<String>()
        set(value) {
            val old = field
            field = value

            shouldCreate = value != old
        }

    fun addPlayerSlave(slave: ReadableMap) {
        val uri = slave.getString("uri") ?: ""
        val type = slave.getString("type") ?: "item"
        val selected = false

        val slaveType =
            if (type == "subtitle") {
                IMedia.Slave.Type.Subtitle
            } else {
                IMedia.Slave.Type.Audio
            }

        try {
            mediaPlayer?.addSlave(slaveType, Uri.parse(uri), selected)
        } catch (_: Exception) {
            val error = mapOf("error" to "Invalid slave, $type could not be added")
            onError(error)
        }
    }

    fun addPlayerSlaves() {
        // Add in this specific order, otherwise subtitle slaves will be missing
        slaves?.filter { it.getString("type") == "subtitle" }?.forEach(::addPlayerSlave)
        slaves?.filter { it.getString("type") == "audio" }?.forEach(::addPlayerSlave)
    }

    var slaves: ArrayList<ReadableMap>? = null
        set(value) {
            field = value
            addPlayerSlaves()
        }

    fun setPlayerTracks() {
        mediaPlayer?.let { player ->
            val audioTrack = tracks?.takeIf { it.hasKey("audio") }?.getInt("audio") ?: player.getAudioTrack()
            val videoTrack = tracks?.takeIf { it.hasKey("video") }?.getInt("video") ?: player.getVideoTrack()
            val spuTrack = tracks?.takeIf { it.hasKey("subtitle") }?.getInt("subtitle") ?: player.getSpuTrack()

            player.setAudioTrack(audioTrack)
            player.setVideoTrack(videoTrack)
            player.setSpuTrack(spuTrack)
        }
    }

    var tracks: ReadableMap? = null
        set(value) {
            if (options.hasAudioTrackOption()) {
                val error = mapOf("error" to "Audio track selected via options")
                onError(error)
            }

            if (options.hasSubtitleTrackOption()) {
                val error = mapOf("error" to "Subtitle track selected via options")
                onError(error)
            }

            field = value
            setPlayerTracks()
        }

    fun setVolume(volume: Int) {
        if (options.hasAudioOption()) {
            val error = mapOf("error" to "Audio disabled via options")
            onError(error)
        }

        val newVolume = volume.coerceIn(MIN_PLAYER_VOLUME, MAX_PLAYER_VOLUME)
        userVolume = newVolume

        mediaPlayer?.setVolume(newVolume)
        MediaPlayerManager.audioFocusManager.updateAudioFocus()
    }

    fun setMute(mute: Boolean) {
        if (options.hasAudioOption()) {
            val error = mapOf("error" to "Audio disabled via options")
            onError(error)
        }

        val newVolume =
            if (!mute) {
                userVolume.coerceIn(PLAYER_VOLUME_STEP, MAX_PLAYER_VOLUME)
            } else {
                MIN_PLAYER_VOLUME
            }

        mediaPlayer?.setVolume(newVolume)
        MediaPlayerManager.audioFocusManager.updateAudioFocus()
    }

    fun setRate(rate: Float) {
        mediaPlayer?.setRate(rate)
    }

    var time: Int = DEFAULT_PLAYER_START
        set(value) {
            field = value
        }

    fun setRepeat(repeat: Boolean) {
        if (options.hasRepeatOption()) {
            val error = mapOf("error" to "Repeat enabled via options")
            onError(error)
        }

        this.repeat = repeat
    }

    fun setAspectRatio(aspectRatio: String?) {
        mediaPlayer?.setAspectRatio(aspectRatio)
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

    fun setAutoplay(autoplay: Boolean) {
        this.autoplay = autoplay
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
                val error = mapOf("error" to "Media is not seekable")
                onError(error)
            }
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()

        MediaPlayerManager.unregisterView(this)
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
