package expo.modules.libvlcplayer

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Size
import android.view.PixelCopy
import android.view.Surface
import android.view.TextureView
import android.view.ViewGroup
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
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

class LibVlcPlayerView(
    context: Context,
    appContext: AppContext,
) : ExpoView(context, appContext) {
    val playerLayout: VLCVideoLayout = VLCVideoLayout(context)
    val pictureLayout: VLCVideoLayout = VLCVideoLayout(context)
    private var pauseIfJob: Job? = null

    var libVLC: LibVLC? = null
    var mediaPlayer: MediaPlayer? = null
    var vlcDialog: VLCDialog? = null

    var firstPlay: Boolean = true
    private var shouldInit: Boolean = true
    var isInBackground: Boolean = false

    val onBuffering by EventDispatcher<Unit>()
    val onPlaying by EventDispatcher<Unit>()
    val onPaused by EventDispatcher<Unit>()
    val onStopped by EventDispatcher<Unit>()
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
    val onPictureInPictureStart by EventDispatcher<Unit>()
    val onPictureInPictureStop by EventDispatcher<Unit>()

    init {
        MediaPlayerManager.registerExpoView(this)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()

        attachPlayerLayout(playerLayout)
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()

        detachPlayerLayout()
    }

    override fun onSizeChanged(
        w: Int,
        h: Int,
        oldw: Int,
        oldh: Int,
    ) {
        super.onSizeChanged(w, h, oldw, oldh)

        setContentFit(layout = playerLayout)
        setContentFit(layout = pictureLayout)
    }

    fun getTextureView(layout: VLCVideoLayout): TextureView? = layout.findViewById(org.videolan.R.id.texture_video)

    fun addPlayerLayout(view: VLCVideoLayout) {
        val parent = playerLayout.parent as? ViewGroup

        if (parent == null) {
            addView(view)
        }
    }

    fun removePlayerLayout() {
        val parent = playerLayout.parent as? ViewGroup

        if (parent != null) {
            removeView(playerLayout)
        }
    }

    fun resetPlayer() {
        detachPlayer()
        attachPlayer()
    }

    fun attachPlayer() {
        attachPlayerLayout(playerLayout)
        addPlayerLayout(playerLayout)
    }

    fun detachPlayer() {
        detachPlayerLayout()
        removePlayerLayout()
    }

    fun attachPlayerLayout(view: VLCVideoLayout) {
        mediaPlayer?.let { player ->
            val attached = player.getVLCVout().areViewsAttached()

            if (!attached) {
                player.attachViews(view, DISPLAY_MANAGER, ENABLE_SUBTITLES, USE_TEXTURE_VIEW)
            }
        }
    }

    fun detachPlayerLayout() {
        mediaPlayer?.let { player ->
            val attached = player.getVLCVout().areViewsAttached()

            if (attached) {
                player.detachViews()
            }
        }
    }

    fun initPlayer() {
        if (shouldInit) {
            destroyPlayer()

            if (source != null) {
                createPlayer()
            }
        }
    }

    fun createPlayer() {
        if (pictureInPicture) {
            MediaPlayerManager.pictureInPictureManager.setupPipView(this)
        }

        libVLC = LibVLC(context)
        setDialogCallbacks(libVLC!!)

        mediaPlayer = MediaPlayer(libVLC!!)
        attachPlayerLayout(playerLayout)
        setPlayerListener(mediaPlayer!!)
        setupPlayer()

        try {
            URI(source)
        } catch (_: Exception) {
            onEncounteredError(mapOf("message" to "Invalid source, media could not be set"))
            return
        }

        var args = options
        args.normalizeOptions()
        args.toggleStartPausedOption(autoplay)

        val media = Media(libVLC!!, Uri.parse(source!!))
        args.forEach { arg -> media!!.addOption(arg) }
        mediaPlayer!!.setMedia(media)
        media.release()
        mediaPlayer!!.play()

        firstPlay = true
        shouldInit = false

        addPlayerLayout(playerLayout)
    }

    fun destroyPlayer() {
        libVLC?.release()
        libVLC = null
        mediaPlayer?.release()
        mediaPlayer = null
        removeAllViews()
    }

    fun selectTrack(
        index: Int,
        type: Int,
    ) {
        mediaPlayer?.let { player ->
            when (type) {
                IMedia.Track.Type.Audio -> {
                    player.setAudioTrack(index)
                }

                IMedia.Track.Type.Video -> {
                    player.setVideoTrack(index)
                }

                IMedia.Track.Type.Text -> {
                    player.setSpuTrack(index)
                }
            }
        }
    }

    fun setPlayerTracks() {
        val audioTrack = tracks?.audio
        val videoTrack = tracks?.video
        val spuTrack = tracks?.subtitle

        audioTrack?.let { audioTrack -> selectTrack(audioTrack, IMedia.Track.Type.Audio) }
        videoTrack?.let { videoTrack -> selectTrack(videoTrack, IMedia.Track.Type.Video) }
        spuTrack?.let { spuTrack -> selectTrack(spuTrack, IMedia.Track.Type.Text) }
    }

    fun addPlayerSlaves(slaves: List<Slave>) {
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
                onEncounteredError(mapOf("message" to "Invalid source, $type could not be added"))
                return@forEach
            }

            mediaPlayer?.addSlave(slaveType, Uri.parse(source), selected)
        }
    }

    fun setContentFit(layout: VLCVideoLayout) {
        post {
            val view = getTextureView(layout) ?: return@post
            val matrix = Matrix()

            val video = getVideoSize()

            if (hasVideoSize) {
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

            view.setTransform(matrix)
        }
    }

    fun setupPlayer() {
        post {
            mediaPlayer?.let { player ->
                addPlayerSlaves(slaves)

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

        val duration = mediaPlayer?.getLength() ?: 0L

        if (duration > 0L) {
            length = duration
        }

        return length
    }

    fun getMediaInfo(): MediaInfo {
        var mediaInfo = MediaInfo()

        val video = getVideoSize()
        val length = getMediaLength()
        val seekable = mediaPlayer?.isSeekable() ?: false

        mediaInfo =
            MediaInfo(
                width = video.width,
                height = video.height,
                length = length.toDouble(),
                seekable = seekable,
            )

        return mediaInfo
    }

    fun getVideoSize(): Size {
        val video = mediaPlayer?.getCurrentVideoTrack()
        if (video != null) return Size(video.width, video.height)
        return Size(0, 0)
    }

    val hasVideoSize: Boolean
        get() {
            val video = getVideoSize()
            return video.width > 0 && video.height > 0
        }

    val hasVideoOut: Boolean
        get() {
            val tracks = getMediaTracks()
            val length = getMediaLength()
            val hasVideo = tracks.video.any { track -> track.id != -1 }
            return hasVideo && hasVideoSize && length > 0L
        }

    val hasAudioOut: Boolean
        get() {
            val tracks = getMediaTracks()
            val hasAudio = tracks.audio.any { track -> track.id != -1 }
            val volume = mediaPlayer?.getVolume() ?: MediaPlayerConstants.MIN_PLAYER_VOLUME
            return hasAudio && volume > MediaPlayerConstants.MIN_PLAYER_VOLUME
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
                addPlayerSlaves(newSlaves)
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
            setContentFit(layout = playerLayout)
            setContentFit(layout = pictureLayout)
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

    var pictureInPicture: Boolean = false
        set(value) {
            field = value
            shouldInit = true
        }

    fun play() {
        mediaPlayer?.let { player ->
            if (!autoplay) {
                player.play()
            }

            player.play()
        }
    }

    fun pause() {
        mediaPlayer?.pause()
    }

    fun pauseIf(condition: Boolean? = true) {
        cancelPauseIf()

        pauseIfJob =
            CoroutineScope(Dispatchers.Main).launch {
                delay(MediaPlayerConstants.COROUTINE_DELAY_MS)

                mediaPlayer?.let { player ->
                    val shouldPause = condition == true && player.isPlaying()

                    if (shouldPause) {
                        player.pause()
                    }
                }
            }
    }

    fun cancelPauseIf() {
        pauseIfJob?.cancel()
    }

    fun stop() {
        mediaPlayer?.stop()
    }

    fun seek(
        value: Double,
        type: String? = "time",
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
                    onEncounteredError(mapOf("message" to "Media could not be recorded"))
                }
            } else {
                player.record(null)
            }
        }
    }

    fun snapshot(path: String) {
        try {
            val view = getTextureView(playerLayout) ?: throw Exception()

            if (!hasVideoSize) throw Exception()

            val surface = Surface(view.surfaceTexture)
            val video = getVideoSize()
            val bitmap = Bitmap.createBitmap(video.width, video.height, Bitmap.Config.ARGB_8888)

            PixelCopy.request(
                surface,
                bitmap,
                { copyResult ->
                    try {
                        if (copyResult != PixelCopy.SUCCESS) throw Exception()

                        val simpleDateFormat = SimpleDateFormat("yyyy-MM-dd-HH'h'mm'm'ss's'")
                        val timestamp = simpleDateFormat.format(Calendar.getInstance().time)

                        val snapshotPath = path + "/vlc-snapshot-$timestamp.jpg"
                        val file = File(snapshotPath)

                        FileOutputStream(file).use { stream ->
                            bitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream)
                        }

                        onSnapshotTaken(mapOf("path" to snapshotPath))
                    } catch (_: Exception) {
                        onEncounteredError(mapOf("message" to "Snapshot could not be taken"))
                    }
                },
                Handler(Looper.getMainLooper()),
            )
        } catch (_: Exception) {
            onEncounteredError(mapOf("message" to "Snapshot could not be taken"))
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

    fun postLogin(
        username: String,
        password: String,
        store: Boolean? = false,
    ) {
        vlcDialog?.let { dialog ->
            when (dialog) {
                is VLCDialog.LoginDialog -> {
                    dialog.postLogin(username, password, store ?: false)
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

    fun startPictureInPicture() {
        MediaPlayerManager.pictureInPictureManager.startPictureInPicture(this)
    }

    fun onStartPictureInPicture() {
        MediaPlayerManager.pictureInPictureManager.layoutForPipEnter()
        onPictureInPictureStart(Unit)
    }

    fun onStopPictureInPicture() {
        MediaPlayerManager.pictureInPictureManager.layoutForPipExit()
        onPictureInPictureStop(Unit)
    }

    fun retryUntil(
        maxRetries: Int = MediaPlayerConstants.MAX_RETRY_COUNT,
        retry: Int = 0,
        delay: Long = MediaPlayerConstants.RETRY_DELAY_MS,
        block: (isLastAttempt: Boolean) -> Boolean,
    ) {
        val isLastAttempt = retry >= maxRetries

        if (block(isLastAttempt) || isLastAttempt) return

        val expDelay = (delay.toDouble() * 1.5).toLong()

        postDelayed({
            retryUntil(maxRetries, retry + 1, expDelay, block)
        }, delay)
    }
}

fun LibVlcPlayerView.setPlayerListener(mediaPlayer: MediaPlayer?) {
    mediaPlayer?.let { player ->
        player.setEventListener(
            EventListener { event ->
                val type = event.type

                @Suppress("ktlint")
                when (type) {
                    Event.Buffering -> {
                        onBuffering(Unit)
                    }

                    Event.Playing,
                    Event.Paused,
                    Event.Stopped -> {
                        if (type == Event.Playing) {
                            onPlaying(Unit)

                            if (firstPlay) {
                                setPlayerTracks()

                                retryUntil { isLastAttempt ->
                                    if (hasVideoOut || isLastAttempt) {
                                        onFirstPlay(getMediaInfo())
                                    }

                                    return@retryUntil hasVideoOut
                                }

                                retryUntil { isLastAttempt ->
                                    if (hasVideoSize) {
                                        setContentFit(layout = playerLayout)
                                        setContentFit(layout = pictureLayout)
                                    }

                                    return@retryUntil hasVideoSize
                                }

                                retryUntil { isLastAttempt ->
                                    if (hasAudioOut) {
                                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                                    }

                                    return@retryUntil hasAudioOut
                                }

                                firstPlay = false
                            }
                        }

                        if (type == Event.Paused) {
                            onPaused(Unit)
                        }

                        if (type == Event.Stopped) {
                            onStopped(Unit)

                            resetPlayer()

                            firstPlay = true

                            if (repeat) {
                                player.play()
                            }
                        }

                        MediaPlayerManager.keepAwakeManager.toggleKeepAwake()
                        MediaPlayerManager.audioFocusManager.updateAudioFocus()
                        MediaPlayerManager.pictureInPictureManager.setPipActions()
                    }

                    Event.EndReached -> {
                        player.stop()
                    }

                    Event.EncounteredError -> {
                        onEncounteredError(mapOf("message" to "Player encountered an error"))

                        player.stop()
                    }

                    Event.TimeChanged -> {
                        onTimeChanged(mapOf("value" to player.getTime().toInt()))
                    }

                    Event.PositionChanged -> {
                        onPositionChanged(mapOf("value" to player.getPosition()))
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

fun LibVlcPlayerView.setDialogCallbacks(ILibVLC: LibVLC?) {
    ILibVLC?.let { libVLC ->
        VLCDialog.setCallbacks(
            libVLC,
            object : VLCDialog.Callbacks {
                override fun onDisplay(dialog: VLCDialog.ErrorMessage) {
                    vlcDialog = dialog

                    val dialog =
                        Dialog(
                            title = dialog.getTitle(),
                            text = dialog.getText(),
                            type = "error",
                        )

                    onDialogDisplay(dialog)
                }

                override fun onDisplay(dialog: VLCDialog.LoginDialog) {
                    vlcDialog = dialog

                    val dialog =
                        Dialog(
                            title = dialog.getTitle(),
                            text = dialog.getText(),
                            type = "login",
                        )

                    onDialogDisplay(dialog)
                }

                override fun onDisplay(dialog: VLCDialog.QuestionDialog) {
                    vlcDialog = dialog

                    val dialog =
                        Dialog(
                            title = dialog.getTitle(),
                            text = dialog.getText(),
                            type = "question",
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
}

private fun MutableList<String>.normalizeOptions() {
    val normalized =
        map { option ->
            if (!option.startsWith(":")) {
                ":" + option.dropWhile { character -> character == '-' }
            } else {
                option
            }
        }

    for (i in indices) {
        this[i] = normalized[i]
    }
}

private fun MutableList<String>.toggleStartPausedOption(autoplay: Boolean) {
    val hasOption = contains(":start-paused")

    if (!autoplay && !hasOption) {
        add(":start-paused")
    }
}
