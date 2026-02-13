package expo.modules.libvlcplayer

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import android.view.Surface
import android.view.TextureView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.libvlcplayer.enums.AudioMixingMode
import expo.modules.libvlcplayer.enums.VideoContentFit
import expo.modules.libvlcplayer.records.Dialog
import expo.modules.libvlcplayer.records.MediaInfo
import expo.modules.libvlcplayer.records.MediaTracks
import expo.modules.libvlcplayer.records.Recording
import expo.modules.libvlcplayer.records.Slave
import expo.modules.libvlcplayer.records.Track
import expo.modules.libvlcplayer.records.Tracks
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import org.videolan.libvlc.interfaces.IMedia
import org.videolan.libvlc.util.DisplayManager
import org.videolan.libvlc.util.VLCVideoLayout
import java.io.File
import java.io.FileOutputStream
import java.net.URI
import java.text.SimpleDateFormat
import java.util.Calendar
import org.videolan.libvlc.Dialog as VLCDialog

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
    private val playerView: VLCVideoLayout =
        VLCVideoLayout(context).also {
            addView(it)
        }

    internal var libVLC: LibVLC? = null
    internal var mediaPlayer: MediaPlayer? = null
    private var media: Media? = null
    internal var vlcDialog: VLCDialog? = null

    internal var mediaLength: Long = 0L
    internal var oldVolume: Int = MAX_PLAYER_VOLUME

    private var shouldCreate: Boolean = false
    internal var firstPlay: Boolean = false
    internal var firstTime: Boolean = false

    internal val onBuffering by EventDispatcher<Unit>()
    internal val onPlaying by EventDispatcher<Unit>()
    internal val onPaused by EventDispatcher<Unit>()
    internal val onStopped by EventDispatcher<Unit>()
    internal val onEndReached by EventDispatcher<Unit>()
    internal val onEncounteredError by EventDispatcher()
    internal val onDialogDisplay by EventDispatcher<Dialog>()
    internal val onTimeChanged by EventDispatcher()
    internal val onPositionChanged by EventDispatcher()
    internal val onESAdded by EventDispatcher<MediaTracks>()
    internal val onRecordChanged by EventDispatcher<Recording>()
    internal val onSnapshotTaken by EventDispatcher()
    internal val onFirstPlay by EventDispatcher<MediaInfo>()
    internal val onForeground by EventDispatcher<Unit>()
    internal val onBackground by EventDispatcher<Unit>()

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

        val source = source ?: return

        if (autoplay) {
            options.removeStartPausedOption()
        }

        libVLC = LibVLC(context, options)
        setDialogCallbacks()
        mediaPlayer = MediaPlayer(libVLC)
        setMediaPlayerListener()

        try {
            URI(source)
        } catch (_: Exception) {
            val error = mapOf("error" to "Invalid source, media could not be set")
            onEncounteredError(error)
            return
        }

        media = Media(libVLC, Uri.parse(source))
        mediaPlayer!!.setMedia(media)
        media!!.release()
        addPlayerSlaves()
        mediaPlayer!!.play()

        shouldCreate = false
        firstPlay = true
        firstTime = true
    }

    fun attachPlayer() {
        mediaPlayer?.let { player ->
            val parent = playerView.getParent()

            if (parent == null) {
                addView(playerView)
            }

            val attached = player.getVLCVout().areViewsAttached()

            if (!attached) {
                player.attachViews(playerView, DISPLAY_MANAGER, ENABLE_SUBTITLES, USE_TEXTURE_VIEW)
            }
        }
    }

    fun detachPlayer() {
        mediaPlayer?.detachViews()
        removeAllViews()
    }

    fun destroyPlayer() {
        vlcDialog = null
        media = null
        mediaPlayer?.release()
        mediaPlayer = null
        libVLC?.release()
        libVLC = null
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
            val source = slave.source
            val type = slave.type
            val slaveType =
                if (type == "subtitle") {
                    IMedia.Slave.Type.Subtitle
                } else {
                    IMedia.Slave.Type.Audio
                }
            val selected = slave.selected ?: false

            try {
                URI(source)
            } catch (_: Exception) {
                val error = mapOf("error" to "Invalid slave, $type could not be added")
                onEncounteredError(error)
                return@forEach
            }

            mediaPlayer?.addSlave(slaveType, Uri.parse(source), selected)
        }
    }

    fun setContentFit() {
        mediaPlayer?.let { player ->
            val textureView = playerView.findViewById<TextureView>(org.videolan.R.id.texture_video) ?: return
            val video = player.getCurrentVideoTrack() ?: return

            val viewWidth = playerView.width.toFloat()
            val viewHeight = playerView.height.toFloat()

            val videoWidth = video.width.toFloat()
            val videoHeight = video.height.toFloat()

            val viewAspect = viewWidth / viewHeight
            val videoAspect = videoWidth / videoHeight

            val pivotX = viewWidth / 2f
            val pivotY = viewHeight / 2f

            val matrix = Matrix()

            when (contentFit) {
                VideoContentFit.CONTAIN -> {
                    // No scale required
                }

                VideoContentFit.COVER -> {
                    val scale =
                        if (videoAspect > viewAspect) {
                            videoAspect / viewAspect
                        } else {
                            viewAspect / videoAspect
                        }

                    matrix.setScale(scale, scale, pivotX, pivotY)
                }

                VideoContentFit.FILL -> {
                    var scaleX = 1f
                    var scaleY = 1f

                    if (videoAspect > viewAspect) {
                        scaleX = 1f
                        scaleY = videoAspect / viewAspect
                    } else {
                        scaleX = viewAspect / videoAspect
                        scaleY = 1f
                    }

                    matrix.setScale(scaleX, scaleY, pivotX, pivotY)
                }
            }

            textureView.setTransform(matrix)
        }
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
            setPlayerTracks()

            if (scale != DEFAULT_PLAYER_SCALE) {
                player.setScale(scale)
            }

            if (aspectRatio != null) {
                player.setAspectRatio(aspectRatio)
            }

            setContentFit()

            if (rate != DEFAULT_PLAYER_RATE) {
                player.setRate(rate)
            }

            if (time != DEFAULT_PLAYER_TIME) {
                player.setTime(time.toLong())
            }

            if (volume != MAX_PLAYER_VOLUME || mute) {
                val newVolume =
                    if (mute) {
                        MIN_PLAYER_VOLUME
                    } else {
                        volume
                    }

                player.setVolume(newVolume)
            }

            time = DEFAULT_PLAYER_TIME
        }
    }

    var source: String? = null
        set(value) {
            val old = field
            field = value
            shouldCreate = value != old
        }

    var options: ArrayList<String> = ArrayList()
        set(value) {
            val old = field
            field = value
            shouldCreate = value != old
        }

    var tracks: Tracks? = null
        set(value) {
            field = value
            setPlayerTracks()
        }

    var slaves: ArrayList<Slave> = ArrayList()
        set(value) {
            val newSlaves = value.filter { slave -> slave !in field }

            field = field.apply { addAll(newSlaves) }

            if (!newSlaves.isEmpty()) {
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

    var contentFit: VideoContentFit = VideoContentFit.CONTAIN
        set(value) {
            field = value
            setContentFit()
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
            oldVolume = newVolume

            if (!mute) {
                mediaPlayer?.setVolume(newVolume)
            }
        }

    var mute: Boolean = false
        set(value) {
            field = value

            if (options.hasAudioOption()) {
                val error = mapOf("error" to "Audio disabled via options")
                onEncounteredError(error)
            }

            val newVolume =
                if (value) {
                    MIN_PLAYER_VOLUME
                } else {
                    oldVolume
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

    var repeat: Boolean = false
        set(value) {
            field = value

            if (options.hasRepeatOption()) {
                val error = mapOf("error" to "Repeat enabled via options")
                onEncounteredError(error)
            }
        }

    var autoplay: Boolean = true
        set(value) {
            field = value

            if (!value) {
                options.add("--start-paused")
            }
        }

    fun play() {
        mediaPlayer?.let { player ->
            if (options.hasStartPausedOption()) {
                player.play()
            }

            player.play()
        }
    }

    fun pause() {
        mediaPlayer?.pause()
    }

    fun stop() {
        mediaPlayer?.stop()
    }

    fun seek(
        value: Double,
        type: String,
    ) {
        mediaPlayer?.let { player ->
            if (player.isSeekable()) {
                if (type == "position") {
                    player.setPosition(value.toFloat())
                } else {
                    player.setTime(value.toLong())
                }
            } else {
                if (type == "position") {
                    time = (value * mediaLength.toDouble()).toInt()
                } else {
                    time = value.toInt()
                }
            }
        }
    }

    fun record(path: String?) {
        mediaPlayer?.let { player ->
            if (!player.isPlaying()) {
                return
            }

            if (path != null) {
                val success = player.record(path)

                if (!success) {
                    val error = mapOf("error" to "Media could not be recorded")
                    onEncounteredError(error)

                    player.record(null)
                }
            } else {
                player.record(null)
            }
        }
    }

    fun snapshot(path: String) {
        mediaPlayer?.let { player ->
            try {
                val textureView = playerView.findViewById<TextureView>(org.videolan.R.id.texture_video) ?: throw Exception()
                val video = player.getCurrentVideoTrack() ?: throw Exception()

                val surface = Surface(textureView.surfaceTexture)
                val bitmap = Bitmap.createBitmap(video.width, video.height, Bitmap.Config.ARGB_8888)

                PixelCopy.request(
                    surface,
                    bitmap,
                    { copyResult ->
                        if (copyResult != PixelCopy.SUCCESS) {
                            throw Exception()
                        }

                        val simpleDateFormat = SimpleDateFormat("yyyy-MM-dd-HH'h'mm'm'ss's'")
                        val timestamp = Calendar.getInstance().time
                        val snapshotPath = path + "/vlc-snapshot-${simpleDateFormat.format(timestamp)}.jpg"
                        val file = File(snapshotPath)

                        FileOutputStream(file).use { stream ->
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream)
                        }

                        val path = mapOf("path" to snapshotPath)
                        onSnapshotTaken(path)
                    },
                    Handler(Looper.getMainLooper()),
                )
            } catch (_: Exception) {
                val error = mapOf("error" to "Media snapshot could not be taken")
                onEncounteredError(error)
            }
        }
    }

    fun postAction(action: Int) {
        vlcDialog?.let { dialog ->
            when (dialog) {
                is VLCDialog.QuestionDialog -> {
                    dialog.postAction(action)
                    vlcDialog = null
                }
            }
        }
    }

    fun dismiss() {
        vlcDialog?.let { dialog ->
            dialog.dismiss()
            vlcDialog = null
        }
    }

    private fun ArrayList<String>.hasAudioOption(): Boolean {
        val options =
            setOf(
                "--no-audio",
                "-no-audio",
                ":no-audio",
            )

        return this.any { option -> option in options }
    }

    internal fun ArrayList<String>.hasRepeatOption(): Boolean {
        val options =
            setOf(
                "--input-repeat=",
                "-input-repeat=",
                ":input-repeat=",
            )

        return this.any { option ->
            options.any { value ->
                option.startsWith(value)
            }
        }
    }

    internal fun ArrayList<String>.hasStartPausedOption(): Boolean {
        val options =
            setOf(
                "--start-paused",
                "-start-paused",
                ":start-paused",
            )

        return this.any { option -> option in options }
    }

    internal fun ArrayList<String>.removeStartPausedOption() {
        val options =
            setOf(
                "--start-paused",
                "-start-paused",
                ":start-paused",
            )

        this.removeAll(options)
    }
}
