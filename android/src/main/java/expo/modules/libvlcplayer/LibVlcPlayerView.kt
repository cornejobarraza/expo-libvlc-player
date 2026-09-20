package expo.modules.libvlcplayer

import android.content.Context
import android.graphics.Bitmap
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import android.view.Surface
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.enums.AudioMixingMode
import expo.modules.libvlcplayer.enums.VideoContentFit
import expo.modules.libvlcplayer.managers.MediaPlayerManager
import expo.modules.libvlcplayer.player.MediaPlayer
import expo.modules.libvlcplayer.records.Delays
import expo.modules.libvlcplayer.records.Dialog
import expo.modules.libvlcplayer.records.Media
import expo.modules.libvlcplayer.records.MediaInfo
import expo.modules.libvlcplayer.records.MediaTracks
import expo.modules.libvlcplayer.records.Recording
import expo.modules.libvlcplayer.records.Slave
import expo.modules.libvlcplayer.records.Tracks
import org.videolan.libvlc.util.VLCVideoLayout
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Calendar
import org.videolan.libvlc.Dialog as VLCDialog
import org.videolan.libvlc.MediaPlayer as VLCMediaPlayer

class LibVlcPlayerView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {
  private val player = MediaPlayer(this)

  val mediaPlayer: VLCMediaPlayer?
    get() = player.mediaPlayer
  val video: VLCVideoLayout
    get() = player.video
  val picture: VLCVideoLayout
    get() = player.picture

  val onBuffering by EventDispatcher()
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

  fun deinit() {
    MediaPlayerManager.unregisterExpoView(this)
    destroyPlayer()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    attachPlayerView(video)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    detachPlayerView()
  }

  override fun onSizeChanged(
    w: Int,
    h: Int,
    oldw: Int,
    oldh: Int,
  ) {
    super.onSizeChanged(w, h, oldw, oldh)
    player.applyContentFit()
  }

  fun getTextureView(layout: VLCVideoLayout) = player.getTextureView(layout)

  fun attachPlayerView(layout: VLCVideoLayout) = player.attachPlayerView(layout)

  fun detachPlayerView() = player.detachPlayerView()

  fun initPlayer() = player.initPlayer()

  fun destroyPlayer() = player.destroyPlayer()

  fun pauseDelay() = player.pauseDelay()

  fun cancelPauseDelay() = player.cancelPauseDelay()

  fun onStartPictureInPicture() = player.onStartPictureInPicture()

  fun onStopPictureInPicture() = player.onStopPictureInPicture()

  var source: String? = null
    set(value) {
      field = value
      player.shouldInit = true
    }

  var options: MutableList<String> = mutableListOf()
    set(value) {
      field = value
      player.shouldInit = true
    }

  var slaves: MutableList<Slave> = mutableListOf()
    set(value) {
      val newSlaves =
        value.filter { slave ->
          field.none { existing -> existing.source == slave.source && existing.type == slave.type }
        }

      field = field.apply { addAll(newSlaves) }

      if (!newSlaves.isEmpty()) {
        player.addPlayerSlaves(newSlaves)
      }
    }

  var tracks: Tracks? = null
    set(value) {
      field = value
      player.setPlayerTracks()
    }

  var delays: Delays? = null
    set(value) {
      field = value
      player.setPlayerDelays()
    }

  var scale: Double = MediaPlayerConstants.DEFAULT_PLAYER_SCALE
    set(value) {
      field = value
      mediaPlayer?.setScale(value.toFloat())
    }

  var contentFit: VideoContentFit = VideoContentFit.CONTAIN
    set(value) {
      field = value
      player.applyContentFit()
    }

  var rate: Double = MediaPlayerConstants.DEFAULT_PLAYER_RATE
    set(value) {
      field = value
      mediaPlayer?.setRate(value.toFloat())
    }

  var time: Int = MediaPlayerConstants.DEFAULT_PLAYER_TIME

  var volume: Int = MediaPlayerConstants.MAX_PLAYER_VOLUME
    set(value) {
      val oldValue = field
      val newVolume =
        value.coerceIn(
          MediaPlayerConstants.MIN_PLAYER_VOLUME,
          MediaPlayerConstants.MAX_PLAYER_VOLUME,
        )

      field = newVolume

      if (mute) return

      mediaPlayer?.setVolume(newVolume)

      val hadVolume = oldValue > MediaPlayerConstants.MIN_PLAYER_VOLUME
      val hasVolume = newVolume > MediaPlayerConstants.MIN_PLAYER_VOLUME

      if (hadVolume != hasVolume) {
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
          volume
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
      player.shouldInit = true
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

  fun stop() {
    player.userStop = true
    mediaPlayer?.stop()
  }

  fun seek(
    value: Double,
    type: String? = "time",
  ) {
    mediaPlayer?.let { player ->
      if (type == "position") {
        player.setPosition(value.toFloat())
      } else {
        player.setTime(value.toLong())
      }
    }
  }

  fun record(path: String?) {
    mediaPlayer?.let { player ->
      if (path != null) {
        val success = player.record(path, true)

        if (!success) {
          onEncounteredError(mapOf("message" to "Media could not be recorded"))
        }
      } else {
        player.record(null, false)
      }
    }
  }

  fun snapshot(path: String) {
    try {
      val view = getTextureView(video) ?: throw Exception()

      if (!player.hasVideoSize) throw Exception()

      val surface = Surface(view.surfaceTexture)
      val video = player.getVideo()
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
    player.vlcDialog?.let { dialog ->
      when (dialog) {
        is VLCDialog.QuestionDialog -> {
          dialog.postAction(action)
          player.vlcDialog = null
        }
      }
    }
  }

  fun postLogin(
    username: String,
    password: String?,
    store: Boolean? = false,
  ) {
    player.vlcDialog?.let { dialog ->
      when (dialog) {
        is VLCDialog.LoginDialog -> {
          dialog.postLogin(username, password ?: "", store ?: false)
          player.vlcDialog = null
        }
      }
    }
  }

  fun dismiss() {
    player.vlcDialog?.let { dialog ->
      dialog.dismiss()
      player.vlcDialog = null
    }
  }

  fun startPictureInPicture() {
    MediaPlayerManager.pictureInPictureManager.startPictureInPicture(this)
  }
}
