package expo.modules.libvlcplayer.player

import android.content.res.AssetFileDescriptor
import android.graphics.Matrix
import android.net.Uri
import android.view.TextureView
import android.view.ViewGroup
import expo.modules.libvlcplayer.LibVlcPlayerView
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.enums.VideoContentFit
import expo.modules.libvlcplayer.managers.MediaPlayerManager
import expo.modules.libvlcplayer.records.Dialog
import expo.modules.libvlcplayer.records.Media
import expo.modules.libvlcplayer.records.MediaInfo
import expo.modules.libvlcplayer.records.MediaTrack
import expo.modules.libvlcplayer.records.MediaTracks
import expo.modules.libvlcplayer.records.Metadata
import expo.modules.libvlcplayer.records.Recording
import expo.modules.libvlcplayer.records.Slave
import expo.modules.libvlcplayer.records.Video
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.MediaPlayer.Event
import org.videolan.libvlc.MediaPlayer.EventListener
import org.videolan.libvlc.interfaces.IMedia
import org.videolan.libvlc.util.DisplayManager
import org.videolan.libvlc.util.VLCVideoLayout
import java.io.File
import java.io.FileOutputStream
import java.net.URI
import org.videolan.libvlc.Dialog as VLCDialog
import org.videolan.libvlc.Media as VLCMedia
import org.videolan.libvlc.MediaPlayer as VLCMediaPlayer

private val DISPLAY_MANAGER: DisplayManager? = null
private val ENABLE_SUBTITLES: Boolean = true
private val USE_TEXTURE_VIEW: Boolean = true

class MediaPlayer(
  val view: LibVlcPlayerView,
) {
  private val context = view.context

  val video: VLCVideoLayout = VLCVideoLayout(context)
  val picture: VLCVideoLayout = VLCVideoLayout(context)

  private var sourceFd: AssetFileDescriptor? = null
  private var pauseJob: Job? = null

  var libVlc: LibVLC? = null
  var mediaPlayer: VLCMediaPlayer? = null
  var vlcDialog: VLCDialog? = null

  var userStop: Boolean = false
  var firstPlay: Boolean = true
  var shouldInit: Boolean = true

  val hasVideoSize: Boolean
    get() {
      val video = getVideo()
      return video.width > 0 && video.height > 0
    }

  val hasMediaLength: Boolean
    get() {
      val length = getLength()
      return length > 0
    }

  val hasMediaVolume: Boolean
    get() {
      val volume = mediaPlayer?.getVolume() ?: MediaPlayerConstants.MIN_PLAYER_VOLUME
      return volume > MediaPlayerConstants.MIN_PLAYER_VOLUME
    }

  fun getSourceId(source: String): Int? {
    if (Uri.parse(source).scheme != null) return null

    val identifier = context.resources.getIdentifier(source, "raw", context.packageName)

    return identifier.takeIf { it != 0 }
  }

  fun openSourceFd(source: String): AssetFileDescriptor? {
    val sourceId = getSourceId(source) ?: return null

    sourceFd =
      try {
        context.resources.openRawResourceFd(sourceId)
      } catch (_: Exception) {
        null
      }

    return sourceFd
  }

  fun createMedia(
    libVlc: LibVLC,
    source: String,
  ): VLCMedia {
    val file = openSourceFd(source)

    return if (file != null) {
      VLCMedia(libVlc, file)
    } else {
      VLCMedia(libVlc, Uri.parse(source))
    }
  }

  fun getSourceUri(source: String): Uri {
    val sourceUri = Uri.parse(source)
    val sourceId = getSourceId(source) ?: return sourceUri
    val cacheDir = File(context.cacheDir, MediaPlayerConstants.SOURCE_CACHE_DIR)
    val file = File(cacheDir, source)

    try {
      cacheDir.mkdirs()
      context.resources.openRawResource(sourceId).use { input ->
        FileOutputStream(file).use { output -> input.copyTo(output) }
      }
    } catch (_: Exception) {
      return sourceUri
    }

    return Uri.fromFile(file)
  }

  fun getTextureView(layout: VLCVideoLayout): TextureView? =
    layout.findViewById(org.videolan.R.id.texture_video)

  fun addPlayerLayout(layout: VLCVideoLayout) {
    val parent = video.parent as? ViewGroup

    if (parent == null) {
      view.addView(layout)
    }
  }

  fun removePlayerView() {
    val parent = video.parent as? ViewGroup

    if (parent != null) {
      view.removeView(video)
    }
  }

  fun resetPlayer() {
    detachPlayer()
    attachPlayer()
  }

  fun attachPlayer() {
    attachPlayerView(video)
    addPlayerLayout(video)
  }

  fun detachPlayer() {
    detachPlayerView()
    removePlayerView()
  }

  fun attachPlayerView(layout: VLCVideoLayout) {
    mediaPlayer?.let { player ->
      val attached = player.getVLCVout().areViewsAttached()

      if (!attached) {
        player.attachViews(layout, DISPLAY_MANAGER, ENABLE_SUBTITLES, USE_TEXTURE_VIEW)
      }
    }
  }

  fun detachPlayerView() {
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

      if (view.source != null) {
        createPlayer()
      }
    }
  }

  fun createPlayer() {
    if (view.pictureInPicture) {
      MediaPlayerManager.pictureInPictureManager.setupPipView(view)
    }

    libVlc = LibVLC(context)
    setDialogCallbacks()

    mediaPlayer = VLCMediaPlayer(libVlc!!)
    setPlayerListener()

    attachPlayerView(video)
    addPlayerSlaves(view.slaves)

    try {
      URI(view.source)
    } catch (_: Exception) {
      view.onEncounteredError(mapOf("message" to "Invalid source, media could not be set"))
      return
    }

    var args = view.options
    args.normalizeOptions()
    args.toggleStartPausedOption(view.autoplay)

    val media = createMedia(libVlc!!, view.source!!)
    args.forEach { arg -> media.addOption(arg) }
    mediaPlayer!!.setMedia(media)
    media.release()
    mediaPlayer!!.play()

    firstPlay = true
    shouldInit = false

    addPlayerLayout(video)
  }

  fun destroyPlayer() {
    cancelPauseDelay()
    sourceFd?.close()
    sourceFd = null
    libVlc?.release()
    libVlc = null
    mediaPlayer?.release()
    mediaPlayer = null
    vlcDialog = null
    view.removeAllViews()
  }

  fun setupPlayer() {
    view.post {
      mediaPlayer?.let { player ->
        if (view.scale != MediaPlayerConstants.DEFAULT_PLAYER_SCALE) {
          player.setScale(view.scale.toFloat())
        }

        if (view.rate != MediaPlayerConstants.DEFAULT_PLAYER_RATE) {
          player.setRate(view.rate.toFloat())
        }

        if (view.time != MediaPlayerConstants.DEFAULT_PLAYER_TIME) {
          player.setTime(view.time.toLong())
        }

        // Negative volume workaround
        retryUntil {
          val newVolume =
            if (view.mute) {
              MediaPlayerConstants.MIN_PLAYER_VOLUME
            } else {
              view.volume
            }

          player.setVolume(newVolume)

          return@retryUntil false
        }

        view.time = MediaPlayerConstants.DEFAULT_PLAYER_TIME
      }
    }
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
        view.onEncounteredError(mapOf("message" to "Invalid source, $type could not be added"))
        return@forEach
      }

      mediaPlayer?.addSlave(slaveType, getSourceUri(source), selected)
    }
  }

  fun selectTrack(
    index: Int,
    type: Int,
  ) {
    mediaPlayer?.let { player ->
      if (index == -1) {
        player.unselectTrackType(type)
      } else {
        player.selectTrack(index.toString())
      }
    }
  }

  fun setPlayerTracks() {
    val audioTrack = view.tracks?.audio
    val videoTrack = view.tracks?.video
    val spuTrack = view.tracks?.subtitle

    audioTrack?.let { track -> selectTrack(track, IMedia.Track.Type.Audio) }
    videoTrack?.let { track -> selectTrack(track, IMedia.Track.Type.Video) }
    spuTrack?.let { track -> selectTrack(track, IMedia.Track.Type.Text) }
  }

  fun setPlayerDelays() {
    mediaPlayer?.let { player ->
      val audioDelay = view.delays?.audio
      val spuDelay = view.delays?.subtitle

      audioDelay?.let { delay -> player.setAudioDelay(delay) }
      spuDelay?.let { delay -> player.setSpuDelay(delay) }
    }
  }

  fun setContentFit(layout: VLCVideoLayout) {
    view.post {
      val textureView = getTextureView(layout) ?: return@post
      val matrix = Matrix()

      val video = getVideo()

      if (hasVideoSize) {
        val viewWidth = textureView.width.toFloat()
        val viewHeight = textureView.height.toFloat()

        val videoWidth = video.width.toFloat()
        val videoHeight = video.height.toFloat()

        val viewAspect = viewWidth / viewHeight
        val videoAspect = videoWidth / videoHeight

        val pivotX = viewWidth / 2f
        val pivotY = viewHeight / 2f

        when (view.contentFit) {
          VideoContentFit.CONTAIN -> {
            // No scaling required
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

      textureView.setTransform(matrix)
    }
  }

  fun applyContentFit() {
    setContentFit(layout = video)
    setContentFit(layout = picture)
  }

  fun getMediaTracks(): MediaTracks {
    val player = mediaPlayer ?: return MediaTracks()

    val disableTrack = MediaTrack(id = -1, name = "Disable")

    val audios =
      player
        .getTracks(
          IMedia.Track.Type.Audio,
        )?.mapIndexed { index, track -> MediaTrack(id = index, name = track.name) }
    val videos =
      player.getTracks(IMedia.Track.Type.Video)?.mapIndexed {
        index,
        track,
        ->
        MediaTrack(id = index, name = track.name)
      }
    val subtitles =
      player.getTracks(IMedia.Track.Type.Text)?.mapIndexed {
        index,
        track,
        ->
        MediaTrack(id = index, name = track.name)
      }

    val audio = listOf(disableTrack) + (audios ?: emptyList())
    val video = listOf(disableTrack) + (videos ?: emptyList())
    val subtitle = listOf(disableTrack) + (subtitles ?: emptyList())

    return MediaTracks(
      audio = audio,
      video = video,
      subtitle = subtitle,
    )
  }

  fun getMedia(): Media {
    val length = (mediaPlayer?.getLength() ?: 0).toInt()
    val seekable = mediaPlayer?.isSeekable() ?: false

    return Media(
      length = length,
      seekable = seekable,
    )
  }

  fun getMetadata(): Metadata {
    val media = mediaPlayer?.media ?: return Metadata()

    val title = media.getMeta(IMedia.Meta.Title)
    val artist = media.getMeta(IMedia.Meta.Artist)
    val album = media.getMeta(IMedia.Meta.Album)
    val artworkURL = media.getMeta(IMedia.Meta.ArtworkURL)

    return Metadata(
      title = title,
      artist = artist,
      album = album,
      artworkURL = artworkURL,
    )
  }

  fun getVideo(): Video {
    val video =
      mediaPlayer?.getSelectedTrack(IMedia.Track.Type.Video) as? IMedia.VideoTrack ?: return Video()

    val width = video.width
    val height = video.height
    val frameRate =
      if (video.frameRateDen != 0) {
        video.frameRateNum / video.frameRateDen
      } else {
        0
      }
    val bitrate = video.bitrate

    return Video(
      width = width,
      height = height,
      frameRate = frameRate,
      bitrate = bitrate,
    )
  }

  fun getMediaInfo(): MediaInfo {
    val media = getMedia()
    val metadata = getMetadata()
    val video = getVideo()

    return MediaInfo(
      media = media,
      metadata = metadata,
      video = video,
    )
  }

  fun getLength(): Int = (mediaPlayer?.getLength() ?: 0).toInt()

  fun pauseDelay() {
    cancelPauseDelay()

    pauseJob =
      CoroutineScope(Dispatchers.Main).launch {
        delay(MediaPlayerConstants.PAUSE_DELAY_MS)
        mediaPlayer?.pause()
      }
  }

  fun cancelPauseDelay() {
    pauseJob?.cancel()
  }

  fun onStartPictureInPicture() {
    MediaPlayerManager.pictureInPictureManager.layoutForPipEnter()
    view.onPictureInPictureStart(Unit)
  }

  fun onStopPictureInPicture() {
    MediaPlayerManager.pictureInPictureManager.layoutForPipExit()
    view.onPictureInPictureStop(Unit)
  }

  fun retryUntil(
    maxRetries: Int = MediaPlayerConstants.MAX_RETRY_COUNT,
    retry: Int = 0,
    delay: Double = MediaPlayerConstants.RETRY_DELAY_MS,
    block: (isLastAttempt: Boolean) -> Boolean,
  ) {
    val isLastAttempt = retry > maxRetries

    if (block(isLastAttempt) || isLastAttempt) return

    val wait = if (retry > 0) delay else 0.0
    val nextDelay = if (retry > 0) delay * MediaPlayerConstants.EXP_DELAY_MULTIPLIER else delay
    val postDelay = wait.toLong()

    view.postDelayed({
      retryUntil(maxRetries, retry + 1, nextDelay, block)
    }, postDelay)
  }
}

fun MediaPlayer.setPlayerListener() {
  mediaPlayer?.let { player ->
    player.setEventListener(
      EventListener { event ->
        val type = event.type

        when (type) {
          Event.Buffering -> {
            view.onBuffering(mapOf("value" to event.getBuffering()))
          }

          Event.Playing,
          Event.Paused,
          Event.Stopped,
          -> {
            if (type == Event.Playing) {
              view.onPlaying(Unit)

              if (firstPlay) {
                setupPlayer()
                setPlayerTracks()
                setPlayerDelays()

                retryUntil {
                  if (hasVideoSize) {
                    applyContentFit()
                  }

                  return@retryUntil hasVideoSize
                }

                retryUntil {
                  if (hasMediaVolume) {
                    MediaPlayerManager.audioFocusManager.updateAudioFocus()
                  }

                  return@retryUntil hasMediaVolume
                }

                retryUntil { isLastAttempt ->
                  if (hasMediaLength || isLastAttempt) {
                    view.onFirstPlay(getMediaInfo())
                  }

                  return@retryUntil hasMediaLength
                }

                firstPlay = false
              }
            }

            if (type == Event.Paused) {
              view.onPaused(Unit)
            }

            if (type == Event.Stopped) {
              resetPlayer()
              view.onStopped(Unit)

              if (view.repeat && !userStop) {
                player.play()
              }

              userStop = false
              firstPlay = true
            }

            MediaPlayerManager.keepAwakeManager.toggleKeepAwake()
            MediaPlayerManager.audioFocusManager.updateAudioFocus()
            MediaPlayerManager.pictureInPictureManager.setPipActions()
          }

          Event.EndReached -> {
            player.stop()
          }

          Event.EncounteredError -> {
            view.onEncounteredError(mapOf("message" to "Player encountered an error"))
            player.stop()
          }

          Event.TimeChanged -> {
            view.onTimeChanged(mapOf("value" to player.getTime().toInt()))
          }

          Event.PositionChanged -> {
            view.onPositionChanged(mapOf("value" to player.getPosition()))
          }

          Event.ESAdded -> {
            view.onESAdded(getMediaTracks())
          }

          Event.RecordChanged -> {
            val recording =
              Recording(
                path = event.getRecordPath(),
                isRecording = event.getRecording(),
              )

            view.onRecordChanged(recording)
          }
        }
      },
    )
  }
}

fun MediaPlayer.setDialogCallbacks() {
  libVlc?.let { libVlc ->
    VLCDialog.setCallbacks(
      libVlc,
      object : VLCDialog.Callbacks {
        override fun onDisplay(dialog: VLCDialog.ErrorMessage) {
          vlcDialog = dialog

          val dialog =
            Dialog(
              title = dialog.getTitle(),
              text = dialog.getText(),
              type = "error",
            )

          view.onDialogDisplay(dialog)
        }

        override fun onDisplay(dialog: VLCDialog.LoginDialog) {
          vlcDialog = dialog

          val dialog =
            Dialog(
              title = dialog.getTitle(),
              text = dialog.getText(),
              type = "login",
            )

          view.onDialogDisplay(dialog)
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

          view.onDialogDisplay(dialog)
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
