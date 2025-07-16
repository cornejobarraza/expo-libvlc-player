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

val ENABLE_SUBTITLES = true
val USE_TEXTURE_VIEW = false

class LibVlcPlayerView(
    context: Context,
    appContext: AppContext,
) : ExpoView(context, appContext) {
    internal val playerViewId: String = UUID.randomUUID().toString()

    internal val playerView: VLCVideoLayout =
        VLCVideoLayout(context).also {
            it.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            addView(it)
        }

    private var libVLC: LibVLC? = null
    internal var mediaPlayer: MediaPlayer? = null
    internal var media: Media? = null

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
    }

    fun createPlayer() {
        destroyPlayer()
        libVLC = LibVLC(context, options)
        mediaPlayer = MediaPlayer(libVLC)
        mediaPlayer!!.attachViews(playerView, null, ENABLE_SUBTITLES, USE_TEXTURE_VIEW)
        setMediaPlayerListener()
    }

    fun setupPlayer() {
        mediaPlayer?.let { player ->
            try {
                media = Media(libVLC, Uri.parse(uri))
                player.setMedia(media)
                setMediaListener()
            } catch (_: Exception) {
                val error = mapOf("error" to "Invalid URI, media could not be set")
                onError(error)
            }

            if (autoplay) {
                player.play()
            }
        }
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

            if (value != old) {
                if (mediaPlayer == null) {
                    createPlayer()
                }
                setupPlayer()
            }
        }

    fun setSubtitle(subtitle: ReadableMap?) {
        val uri = subtitle?.getString("uri") ?: ""
        val enable =
            if (subtitle?.hasKey("enable") == true) {
                subtitle.getBoolean("enable")
            } else {
                ENABLE_SUBTITLES
            }

        try {
            mediaPlayer?.addSlave(IMedia.Slave.Type.Subtitle, Uri.parse(uri), enable)
        } catch (_: Exception) {
            val error = mapOf("error" to "Invalid URI, subtitle could not be set")
            onError(error)
        }
    }

    var options: ArrayList<String> = ArrayList<String>()
        set(value) {
            if (value?.isEmpty() == true) {
                return
            }

            val old = field
            field = value

            if (value != old) {
                createPlayer()
                setupPlayer()
            }
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

    fun setTracks(tracks: ReadableMap?) {
        val videoTrack = tracks?.getInt("video") ?: -1
        val audioTrack = tracks?.getInt("audio") ?: -1
        val subtitleTrack = tracks?.getInt("subtitle") ?: -1

        mediaPlayer?.let { player ->
            player.setVideoTrack(videoTrack)
            player.setAudioTrack(audioTrack)
            player.setSpuTrack(subtitleTrack)
        }
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
