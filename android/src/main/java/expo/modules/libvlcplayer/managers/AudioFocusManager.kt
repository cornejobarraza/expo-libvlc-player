package expo.modules.libvlcplayer.managers

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.libvlcplayer.LibVlcPlayerView
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.enums.AudioMixingMode
import kotlinx.coroutines.launch
import org.videolan.libvlc.MediaPlayer
import java.util.WeakHashMap

class AudioFocusManager(
  private val appContext: AppContext,
) : AudioManager.OnAudioFocusChangeListener {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val audioManager by lazy {
    context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: run {
      throw CodedException("Failed to get AudioFocusManager service")
    }
  }

  private val expoViews: MutableSet<LibVlcPlayerView>
    get() = MediaPlayerManager.expoViews
  private val mediaPlayers: List<MediaPlayer>
    get() = expoViews.mapNotNull { view -> view.mediaPlayer }
  private val anyPlayingView: Boolean
    get() =
      mediaPlayers.any { player ->
        playerRequiresFocus(player)
      }

  private var currentFocusRequest: AudioFocusRequest? = null
  private var currentMixingMode: AudioMixingMode = AudioMixingMode.AUTO
  private val preDuckVolumes: MutableMap<MediaPlayer, Int> = WeakHashMap()

  override fun onAudioFocusChange(focusChange: Int) {
    appContext.mainQueue.launch {
      when (focusChange) {
        AudioManager.AUDIOFOCUS_LOSS -> {
          mediaPlayers.forEach { player ->
            pausePlayerIfUnmuted(player)
          }

          currentFocusRequest = null
        }

        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
          val audioMixingMode = findAudioMixingMode()

          if (audioMixingMode == AudioMixingMode.MIX_WITH_OTHERS) {
            return@launch
          }

          mediaPlayers.forEach { player ->
            pausePlayerIfUnmuted(player)
          }

          currentFocusRequest = null
        }

        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
          val audioMixingMode = findAudioMixingMode()

          mediaPlayers.forEach { player ->
            if (audioMixingMode == AudioMixingMode.DO_NOT_MIX) {
              pausePlayerIfUnmuted(player)
            } else {
              duckPlayer(player)
            }
          }
        }

        AudioManager.AUDIOFOCUS_GAIN -> {
          mediaPlayers.forEach { player ->
            unduckPlayer(player)
          }
        }
      }
    }
  }

  fun updateAudioFocus() {
    appContext.mainQueue.launch {
      if (anyPlayingView || findAudioMixingMode() != currentMixingMode) {
        requestAudioFocus()
      } else {
        abandonAudioFocus()
      }
    }
  }

  private fun playerRequiresFocus(player: MediaPlayer): Boolean =
    player.isPlaying() && player.getVolume() > MediaPlayerConstants.MIN_PLAYER_VOLUME

  private fun findAudioMixingMode(): AudioMixingMode {
    val mixingModes =
      expoViews
        .filter { view -> view.mediaPlayer?.isPlaying() == true }
        .map { view -> view.audioMixingMode }

    if (mixingModes.isEmpty()) {
      return AudioMixingMode.AUTO
    }

    return mixingModes.reduce { currentAudioMixingMode, next ->
      next.takeIf { nextAudioMixingMode ->
        nextAudioMixingMode.priority >
          currentAudioMixingMode.priority
      }
        ?: currentAudioMixingMode
    }
  }

  private fun requestAudioFocus() {
    val audioMixingMode = findAudioMixingMode()

    if (audioMixingMode == AudioMixingMode.MIX_WITH_OTHERS || !anyPlayingView) {
      abandonAudioFocus()
      currentMixingMode = audioMixingMode
      return
    }

    val audioFocusType =
      when (currentMixingMode) {
        AudioMixingMode.DUCK_OTHERS -> AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
        AudioMixingMode.AUTO -> AudioManager.AUDIOFOCUS_GAIN
        AudioMixingMode.DO_NOT_MIX -> AudioManager.AUDIOFOCUS_GAIN
        else -> AudioManager.AUDIOFOCUS_GAIN
      }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      currentFocusRequest?.let { request ->
        if (request.focusGain == audioFocusType) {
          return
        }
      }

      val newFocusRequest =
        AudioFocusRequest.Builder(audioFocusType).run {
          setAudioAttributes(
            AudioAttributes.Builder().run {
              setUsage(AudioAttributes.USAGE_MEDIA)
              setContentType(AudioAttributes.CONTENT_TYPE_MOVIE)
              setOnAudioFocusChangeListener(this@AudioFocusManager)
              build()
            },
          ).build()
        }

      val result = audioManager.requestAudioFocus(newFocusRequest)

      currentFocusRequest =
        newFocusRequest.takeIf { result == AudioManager.AUDIOFOCUS_REQUEST_GRANTED }
    } else {
      @Suppress("DEPRECATION")
      audioManager.requestAudioFocus(this, AudioManager.STREAM_MUSIC, audioFocusType)
    }

    currentMixingMode = audioMixingMode
  }

  private fun abandonAudioFocus() {
    currentFocusRequest?.let { request ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        audioManager.abandonAudioFocusRequest(request)
      } else {
        @Suppress("DEPRECATION")
        audioManager.abandonAudioFocus(this)
      }
    }

    currentFocusRequest = null
  }

  private fun pausePlayerIfUnmuted(player: MediaPlayer) {
    if (player.getVolume() > MediaPlayerConstants.MIN_PLAYER_VOLUME) {
      player.pause()
    }
  }

  private fun duckPlayer(player: MediaPlayer) {
    val volume = player.getVolume()

    if (volume > MediaPlayerConstants.MIN_PLAYER_VOLUME) {
      preDuckVolumes[player] = volume
      player.setVolume(volume / 2)
    }
  }

  private fun unduckPlayer(player: MediaPlayer) {
    val restoredVolume = preDuckVolumes.remove(player) ?: return

    if (player.getVolume() > MediaPlayerConstants.MIN_PLAYER_VOLUME) {
      player.setVolume(restoredVolume)
    }
  }
}
