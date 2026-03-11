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
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.enums.AudioMixingMode
import expo.modules.libvlcplayer.enums.VideoContentFit
import expo.modules.libvlcplayer.managers.MediaPlayerManager
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
import org.videolan.libvlc.MediaPlayer.Event
import org.videolan.libvlc.MediaPlayer.EventListener
import org.videolan.libvlc.interfaces.IMedia
import org.videolan.libvlc.util.DisplayManager
import org.videolan.libvlc.util.VLCVideoLayout
import java.io.File
import java.io.FileOutputStream
import java.net.URI
import java.text.SimpleDateFormat
import java.util.Calendar
import org.videolan.libvlc.Dialog as VLCDialog

private val DISPLAY_MANAGER: DisplayManager? = null
private val ENABLE_SUBTITLES: Boolean = true
private val USE_TEXTURE_VIEW: Boolean = true

private val MAX_RETRY_COUNT: Int = 5

class LibVlcPlayerView(
    context: Context,
    appContext: AppContext,
) : ExpoView(context, appContext) {
    private val playerView = VLCVideoLayout(context)

    var libVLC: LibVLC? = null
    var mediaPlayer: MediaPlayer? = null
    var media: Media? = null
    var vlcDialog: VLCDialog? = null

    var firstPlay: Boolean = true
    private var shouldInit: Boolean = true

    val onBuffering by EventDispatcher<Unit>()
    val onPlaying by EventDispatcher<Unit>()
    val onPaused by EventDispatcher<Unit>()
    val onStopped by EventDispatcher<Unit>()
    val onEndReached by EventDispatcher<Unit>()
    val onEncounteredError by EventDispatcher()
    val onDialogDisplay by EventDispatcher<Dialog>()
    val onTimeChanged by EventDispatcher()
    val onPositionChanged by EventDispatcher()
    val onESAdded by EventDispatcher<MediaTracks>()
    val onRecordChanged by EventDispatcher<Recording>()
    val onSnapshotTaken by EventDispatcher()
    val onFirstPlay by EventDispatcher<MediaInfo>()
    val onForeground by EventDispatcher<Unit>()
    val onBackground by EventDispatcher<Unit>()

    init {
        MediaPlayerManager.registerPlayerView(this)
        addView(playerView)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()

        attachPlayer()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()

        detachPlayer()
    }

    override fun onSizeChanged(
        w: Int,
        h: Int,
        oldw: Int,
        oldh: Int,
    ) {
        super.onSizeChanged(w, h, oldw, oldh)

        setContentFit()
    }

    fun getTextureView(): TextureView? = playerView.findViewById(org.videolan.R.id.texture_video)

    fun initPlayer() {
        if (shouldInit) {
            destroyPlayer()

            if (source != null) {
                createPlayer()
            }
        }
    }

    fun createPlayer() {
        libVLC = LibVLC(context, options)
        setDialogCallbacks(libVLC!!)

        mediaPlayer = MediaPlayer(libVLC!!)
        setPlayerListener(mediaPlayer!!)

        try {
            URI(source)
        } catch (_: Exception) {
            onEncounteredError(mapOf("error" to "Invalid source, media could not be set"))
            return
        }

        media = Media(libVLC!!, Uri.parse(source!!))
        mediaPlayer!!.setMedia(media!!)
        media!!.release()

        if (autoplay) {
            mediaPlayer!!.play()
        }

        firstPlay = true
        shouldInit = false
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
        libVLC?.release()
        libVLC = null
        mediaPlayer?.release()
        mediaPlayer = null
        media = null
        removeAllViews()
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
                onEncounteredError(mapOf("error" to "Invalid slave, $type could not be added"))
                return@forEach
            }

            mediaPlayer?.addSlave(slaveType, Uri.parse(source), selected)
        }
    }

    fun setContentFit() {
        post {
            val view = getTextureView() ?: return@post
            val matrix = Matrix()

            mediaPlayer?.let { player ->
                val video = player.getCurrentVideoTrack() ?: return@post

                if (hasVideoSize()) {
                    val viewWidth = view.width.toFloat()
                    val viewHeight = view.height.toFloat()

                    val videoWidth = video.width.toFloat()
                    val videoHeight = video.height.toFloat()

                    val viewAspect = viewWidth / viewHeight
                    val videoAspect = videoWidth / videoHeight

                    val pivotX = viewWidth / 2f
                    val pivotY = viewHeight / 2f

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
                                scaleY = videoAspect / viewAspect
                            } else {
                                scaleX = viewAspect / videoAspect
                            }

                            matrix.setScale(scaleX, scaleY, pivotX, pivotY)
                        }
                    }
                }
            }

            view.setTransform(matrix)
        }
    }

    fun setupPlayer() {
        mediaPlayer?.let { player ->
            setPlayerTracks()

            addPlayerSlaves()

            if (scale != MediaPlayerConstants.DEFAULT_PLAYER_SCALE) {
                player.setScale(scale)
            }

            if (rate != MediaPlayerConstants.DEFAULT_PLAYER_RATE) {
                player.setRate(rate)
            }

            if (time != MediaPlayerConstants.DEFAULT_PLAYER_TIME) {
                player.setTime(time.toLong())
            }

            if (volume != MediaPlayerConstants.MAX_PLAYER_VOLUME || mute) {
                val newVolume =
                    if (mute) {
                        MediaPlayerConstants.MIN_PLAYER_VOLUME
                    } else {
                        volume
                    }

                player.setVolume(newVolume)
            }

            time = MediaPlayerConstants.DEFAULT_PLAYER_TIME
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

    fun getMediaLength(): Long {
        var length: Long = 0L

        mediaPlayer?.let { player ->
            val duration = player.getLength()

            if (duration > 0L) {
                length = duration
            }
        }

        return length
    }

    fun getMediaInfo(): MediaInfo {
        var mediaInfo = MediaInfo()

        mediaPlayer?.let { player ->
            val video = player.getCurrentVideoTrack()
            val length = getMediaLength()
            val seekable = player.isSeekable()

            mediaInfo =
                MediaInfo(
                    width = video?.width ?: 0,
                    height = video?.height ?: 0,
                    length = length.toDouble(),
                    seekable = seekable,
                )
        }

        return mediaInfo
    }

    fun hasAudioVideo(): Boolean {
        val tracks = getMediaTracks()
        val length = getMediaLength()

        val hasAudio = tracks.audio.any { track -> track.id != -1 }
        val hasVideo = tracks.video.any { track -> track.id != -1 }

        val hasAudioOnly = hasAudio && !hasVideo && length > 0L
        val hasAudioAndVideo = hasAudio && hasVideo && hasVideoSize() && length > 0L

        return hasAudioOnly || hasAudioAndVideo
    }

    fun hasVideoSize(): Boolean {
        val video = mediaPlayer?.getCurrentVideoTrack()

        return if (video != null) {
            video.width > 0 && video.height > 0
        } else {
            false
        }
    }

    var source: String? = null
        set(value) {
            field = value
            shouldInit = true
        }

    var options: MutableList<String> = mutableListOf()
        set(value) {
            field = value
            shouldInit = true
        }

    var tracks: Tracks? = null
        set(value) {
            field = value
            setPlayerTracks()
        }

    var slaves: MutableList<Slave> = mutableListOf()
        set(value) {
            val newSlaves = value.filter { slave -> slave !in field }

            field = field.apply { addAll(newSlaves) }

            if (!newSlaves.isEmpty()) {
                addPlayerSlaves()
            }
        }

    var scale: Float = MediaPlayerConstants.DEFAULT_PLAYER_SCALE
        set(value) {
            field = value
            mediaPlayer?.setScale(value)
        }

    var contentFit: VideoContentFit = VideoContentFit.CONTAIN
        set(value) {
            field = value
            setContentFit()
        }

    var rate: Float = MediaPlayerConstants.DEFAULT_PLAYER_RATE
        set(value) {
            field = value
            mediaPlayer?.setRate(value)
        }

    var time: Int = MediaPlayerConstants.DEFAULT_PLAYER_TIME

    var volume: Int = MediaPlayerConstants.MAX_PLAYER_VOLUME
        set(value) {
            field = value

            val newVolume = value.coerceIn(MediaPlayerConstants.MIN_PLAYER_VOLUME, MediaPlayerConstants.MAX_PLAYER_VOLUME)
            MediaPlayerManager.audioFocusManager.oldVolume = newVolume

            if (!mute) {
                mediaPlayer?.setVolume(newVolume)
                MediaPlayerManager.audioFocusManager.updateAudioFocus()
            }
        }

    var mute: Boolean = false
        set(value) {
            field = value

            val newVolume =
                if (value) {
                    MediaPlayerConstants.MIN_PLAYER_VOLUME
                } else {
                    MediaPlayerManager.audioFocusManager.oldVolume
                }

            mediaPlayer?.setVolume(newVolume)
            MediaPlayerManager.audioFocusManager.updateAudioFocus()
        }

    var audioMixingMode: AudioMixingMode = AudioMixingMode.AUTO
        set(value) {
            field = value
            MediaPlayerManager.audioFocusManager.currentMixingMode = value
            MediaPlayerManager.audioFocusManager.updateAudioFocus()
        }

    var repeat: Boolean = false
        set(value) {
            field = value
        }

    var autoplay: Boolean = true
        set(value) {
            field = value
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
                    time = (value * getMediaLength().toDouble()).toInt()
                } else {
                    time = value.toInt()
                }
            }
        }
    }

    fun record(path: String?) {
        mediaPlayer?.let { player ->
            if (path != null) {
                val success = player.record(path)

                if (!success) {
                    onEncounteredError(mapOf("error" to "Media could not be recorded"))

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
                val view = getTextureView() ?: throw Exception()
                val video = player.getCurrentVideoTrack() ?: throw Exception()

                if (!hasVideoSize()) throw Exception()

                val surface = Surface(view.surfaceTexture)
                val bitmap = Bitmap.createBitmap(video.width, video.height, Bitmap.Config.ARGB_8888)

                PixelCopy.request(
                    surface,
                    bitmap,
                    { copyResult ->
                        if (copyResult != PixelCopy.SUCCESS) throw Exception()

                        val simpleDateFormat = SimpleDateFormat("yyyy-MM-dd-HH'h'mm'm'ss's'")
                        val timestamp = Calendar.getInstance().time
                        val snapshotPath = path + "/vlc-snapshot-${simpleDateFormat.format(timestamp)}.jpg"
                        val file = File(snapshotPath)

                        FileOutputStream(file).use { stream ->
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream)
                        }

                        onSnapshotTaken(mapOf("path" to snapshotPath))
                    },
                    Handler(Looper.getMainLooper()),
                )
            } catch (_: Exception) {
                onEncounteredError(mapOf("error" to "Snapshot could not be taken"))
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

    fun retryUntil(
        maxRetries: Int = MAX_RETRY_COUNT,
        retry: Int = 0,
        delay: Long = 100L,
        block: () -> Boolean,
    ) {
        if (block() || retry >= maxRetries) return

        val expDelay = delay.toDouble() * 1.5

        postDelayed({
            retryUntil(
                maxRetries,
                retry + 1,
                expDelay.toLong(),
                block,
            )
        }, delay)
    }
}

fun LibVlcPlayerView.setPlayerListener(player: MediaPlayer) {
    player.setEventListener(
        EventListener { event ->
            when (event.type) {
                Event.Buffering -> {
                    onBuffering(Unit)
                }

                Event.Playing -> {
                    onPlaying(Unit)

                    if (firstPlay) {
                        retryUntil {
                            onFirstPlay(getMediaInfo())
                            return@retryUntil hasAudioVideo()
                        }

                        retryUntil {
                            setContentFit()
                            return@retryUntil hasVideoSize()
                        }

                        setupPlayer()

                        firstPlay = false
                    }

                    attachPlayer()

                    MediaPlayerManager.keepAwakeManager.toggleKeepAwake()

                    retryUntil {
                        val volume = player.getVolume()
                        val hasVolume = volume > MediaPlayerConstants.MIN_PLAYER_VOLUME
                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                        return@retryUntil hasVolume
                    }
                }

                Event.Paused -> {
                    onPaused(Unit)

                    MediaPlayerManager.keepAwakeManager.toggleKeepAwake()
                    MediaPlayerManager.audioFocusManager.updateAudioFocus()
                }

                Event.Stopped -> {
                    onStopped(Unit)

                    detachPlayer()

                    MediaPlayerManager.keepAwakeManager.toggleKeepAwake()
                    MediaPlayerManager.audioFocusManager.updateAudioFocus()
                }

                Event.EndReached -> {
                    onEndReached(Unit)

                    player.stop()

                    if (repeat) {
                        player.play()
                    }
                }

                Event.EncounteredError -> {
                    onEncounteredError(mapOf("error" to "Player encountered an error"))

                    player.stop()
                }

                Event.TimeChanged -> {
                    onTimeChanged(mapOf("time" to player.getTime().toInt()))
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

fun LibVlcPlayerView.setDialogCallbacks(libVLC: LibVLC) {
    VLCDialog.setCallbacks(
        libVLC,
        object : VLCDialog.Callbacks {
            override fun onDisplay(dialog: VLCDialog.ErrorMessage) {
                vlcDialog = dialog

                val dialog =
                    Dialog(
                        title = dialog.getTitle(),
                        text = dialog.getText(),
                    )

                onDialogDisplay(dialog)
            }

            override fun onDisplay(dialog: VLCDialog.LoginDialog) {
                vlcDialog = dialog

                val dialog =
                    Dialog(
                        title = dialog.getTitle(),
                        text = dialog.getText(),
                    )

                onDialogDisplay(dialog)
            }

            override fun onDisplay(dialog: VLCDialog.QuestionDialog) {
                vlcDialog = dialog

                val dialog =
                    Dialog(
                        title = dialog.getTitle(),
                        text = dialog.getText(),
                        cancelText = dialog.getCancelText(),
                        action1Text = dialog.getAction1Text(),
                        action2Text = dialog.getAction2Text(),
                    )

                onDialogDisplay(dialog)
            }

            override fun onDisplay(dialog: VLCDialog.ProgressDialog) {}

            override fun onCanceled(dialog: VLCDialog) {}

            override fun onProgressUpdate(dialog: VLCDialog.ProgressDialog) {}
        },
    )
}
