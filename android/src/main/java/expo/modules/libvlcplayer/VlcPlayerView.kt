package expo.modules.libvlcplayer

import android.content.Context
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.libvlcplayer.enums.AudioMixingMode
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.MediaPlayer.Event
import org.videolan.libvlc.MediaPlayer.EventListener
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

class VlcPlayerView(
    context: Context,
    appContext: AppContext,
) : ExpoView(context, appContext) {
    internal val playerViewId: String = UUID.randomUUID().toString()

    internal val videoLayout: VLCVideoLayout =
        VLCVideoLayout(context).also { layout ->
            layout.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            addView(layout)
        }

    private var libVLC: LibVLC? = null
    internal var mediaPlayer: MediaPlayer? = null
    private var shouldCreate: Boolean = true
    private var shouldSetup: Boolean = false
    private var hasLoaded: Boolean = false
    internal var isBackgrounded: Boolean = false

    private var userVolume: Int = MAX_PLAYER_VOLUME
    private var repeat: Boolean = false
    private var autoplay: Boolean = true

    private val onBuffering by EventDispatcher()
    private val onPlaying by EventDispatcher()
    private val onPaused by EventDispatcher()
    private val onStopped by EventDispatcher()
    private val onEnded by EventDispatcher()
    private val onRepeat by EventDispatcher()
    private val onError by EventDispatcher()
    private val onPositionChanged by EventDispatcher()
    private val onLoad by EventDispatcher<WritableMap>()

    private lateinit var audioFocusManager: AudioFocusManager

    init {
        VlcPlayerManager.registerView(this)
        audioFocusManager = VlcPlayerManager.audioFocusManager
    }

    fun initPlayer() {
        if (shouldCreate) {
            createPlayer()
        }

        if (shouldSetup) {
            setupPlayer()
        }
    }

    fun createPlayer() {
        if (mediaPlayer != null) {
            destroyPlayer()
        }

        libVLC = LibVLC(context, options)
        mediaPlayer = MediaPlayer(libVLC)

        mediaPlayer!!.let { player ->
            player.setEventListener(
                EventListener { event ->
                    when (event.type) {
                        Event.Buffering -> {
                            onBuffering(mapOf())

                            val video = player.getCurrentVideoTrack()

                            if (video != null && !hasLoaded) {
                                val audioTracks = Arguments.createArray()

                                if (player.getAudioTracksCount() > 0) {
                                    val audios = player.getAudioTracks()

                                    audios.forEach { track ->
                                        if (track.id == -1) return@forEach
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

                                val ratio = player.getAspectRatio()
                                val length = player.getLength()
                                val tracks =
                                    Arguments.createMap().apply {
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
                                hasLoaded = true
                            }
                        }

                        Event.Playing -> {
                            onPlaying(mapOf())
                            audioFocusManager.updateAudioFocus()

                            if (player.isSeekable()) {
                                val timestamp = time ?: DEFAULT_PLAYER_START

                                if (timestamp != DEFAULT_PLAYER_START) {
                                    player.setTime(timestamp.toLong())
                                    time = DEFAULT_PLAYER_START
                                }
                            }
                        }

                        Event.Paused -> {
                            val background = mapOf("background" to isBackgrounded)
                            onPaused(background)
                            audioFocusManager.updateAudioFocus()
                        }

                        Event.Stopped -> {
                            onStopped(mapOf())
                            audioFocusManager.updateAudioFocus()

                            val position = 0f
                            onPositionChanged(mapOf("position" to position))
                        }

                        Event.PositionChanged -> {
                            val position = mapOf("position" to event.positionChanged)
                            onPositionChanged(position)
                        }

                        Event.EndReached -> {
                            onEnded(mapOf())
                            player.stop()

                            val manualRepeat = options?.hasRepeatOptions() == false && repeat

                            if (manualRepeat) {
                                onRepeat(mapOf())
                                player.play()
                            }
                        }

                        Event.EncounteredError -> {
                            val error = mapOf("error" to "Player encountered an error")
                            onError(error)
                        }
                    }
                },
            )

            player.attachViews(videoLayout, null, ENABLE_SUBTITLES, USE_TEXTURE_VIEW)
        }

        shouldCreate = false
    }

    fun setupPlayer() {
        mediaPlayer?.let { player ->
            try {
                hasLoaded = false
                val media = Media(libVLC, Uri.parse(uri))
                player.setMedia(media)
            } catch (_: Exception) {
                val error = mapOf("error" to "Invalid URI, media could not be set")
                onError(error)
            }

            if (autoplay) {
                player.play()
            }
        }

        shouldSetup = false
    }

    fun destroyPlayer() {
        mediaPlayer?.let { player ->
            player.stop()
            player.detachViews()
            player.release()
        }
        libVLC?.release()
    }

    var uri: String = ""
        set(value) {
            val old = field
            field = value

            shouldSetup = value != old
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

    var options: ArrayList<String>? = ArrayList<String>()
        set(value) {
            if (value?.isEmpty() == true) {
                return
            }

            val old = field
            field = value

            shouldCreate = value != old
            shouldSetup = value != old
        }

    fun setVolume(volume: Int) {
        val newVolume = volume.coerceIn(MIN_PLAYER_VOLUME, MAX_PLAYER_VOLUME)
        userVolume = newVolume

        mediaPlayer?.setVolume(newVolume)
        audioFocusManager.updateAudioFocus()
    }

    fun setMute(mute: Boolean) {
        val newVolume =
            if (!mute) {
                userVolume.coerceIn(PLAYER_VOLUME_STEP, MAX_PLAYER_VOLUME)
            } else {
                MIN_PLAYER_VOLUME
            }

        mediaPlayer?.setVolume(newVolume)
        audioFocusManager.updateAudioFocus()
    }

    fun setRate(rate: Float) {
        mediaPlayer?.setRate(rate)
    }

    fun setTracks(tracks: ReadableMap?) {
        val audioTrack = tracks?.getInt("audio") ?: -1
        val subtitleTrack = tracks?.getInt("subtitle") ?: -1

        mediaPlayer?.let { player ->
            player.setAudioTrack(audioTrack)
            player.setSpuTrack(subtitleTrack)
        }
    }

    var time: Int? = DEFAULT_PLAYER_START
        set(value) {
            field = value
        }

    fun setRepeat(repeat: Boolean) {
        if (repeat && options?.hasRepeatOptions() == true) {
            val error = mapOf("error" to "Repeat already enabled in options")
            return onError(error)
        }

        this.repeat = repeat
    }

    fun setAspectRatio(aspectRatio: String?) {
        mediaPlayer?.setAspectRatio(aspectRatio)
    }

    var audioMixingMode: AudioMixingMode? = AudioMixingMode.AUTO
        set(value) {
            field = value
            audioFocusManager.updateAudioFocus()
        }

    var playInBackground: Boolean? = false
        set(value) {
            field = value
            audioFocusManager.updateAudioFocus()
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

    private fun ArrayList<String>.hasRepeatOptions(): Boolean {
        val prefixes =
            setOf(
                "--input-repeat=",
                "-input-repeat=",
                ":input-repeat=",
            )

        return this.any { arg ->
            prefixes.any { prefix ->
                arg.startsWith(prefix)
            }
        }
    }
}
