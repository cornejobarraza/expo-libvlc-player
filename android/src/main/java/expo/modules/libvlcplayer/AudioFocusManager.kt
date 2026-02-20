package expo.modules.libvlcplayer

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.libvlcplayer.enums.AudioMixingMode
import kotlinx.coroutines.launch
import org.videolan.libvlc.MediaPlayer

class AudioFocusManager(
    private val appContext: AppContext,
) : AudioManager.OnAudioFocusChangeListener {
    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    private val audioManager by lazy {
        context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: run {
            throw Exception()
        }
    }

    private val playerViews = MediaPlayerManager.playerViews

    private var currentFocusRequest: AudioFocusRequest? = null

    private val anyPlayerRequiresFocus: Boolean
        get() =
            playerViews.toList().any { view ->
                playerRequiresFocus(view.get()?.mediaPlayer)
            }

    var currentMixingMode: AudioMixingMode = AudioMixingMode.AUTO

    var oldVolume: Int = MAX_PLAYER_VOLUME

    private fun playerRequiresFocus(player: MediaPlayer?): Boolean {
        if (player != null) {
            return player.isPlaying() && player.getVolume() > MIN_PLAYER_VOLUME
        } else {
            return false
        }
    }

    private fun findAudioMixingMode(): AudioMixingMode {
        val mixingModes =
            playerViews.toList().mapNotNull { playerView ->
                playerView
                    .get()
                    ?.takeIf { view ->
                        view.mediaPlayer?.isPlaying() == true
                    }?.audioMixingMode
            }

        if (mixingModes.isEmpty()) {
            return AudioMixingMode.AUTO
        }

        return mixingModes.reduce { currentAudioMixingMode, next ->
            next.takeIf { it.priority > currentAudioMixingMode.priority } ?: currentAudioMixingMode
        }
    }

    private fun requestAudioFocus() {
        val audioMixingMode = findAudioMixingMode()

        if (audioMixingMode == AudioMixingMode.MIX_WITH_OTHERS || !anyPlayerRequiresFocus) {
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
            currentFocusRequest?.let {
                if (it.focusGain == audioFocusType) {
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

            currentFocusRequest = newFocusRequest
            audioManager.requestAudioFocus(newFocusRequest)
        } else {
            audioManager.requestAudioFocus(this, AudioManager.STREAM_MUSIC, audioFocusType)
        }

        currentMixingMode = audioMixingMode
    }

    private fun abandonAudioFocus() {
        currentFocusRequest?.let {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioManager.abandonAudioFocusRequest(it)
            } else {
                audioManager.abandonAudioFocus(this)
            }
        }

        currentFocusRequest = null
    }

    fun updateAudioFocus() {
        if (anyPlayerRequiresFocus || findAudioMixingMode() != currentMixingMode) {
            requestAudioFocus()
        } else {
            abandonAudioFocus()
        }
    }

    private fun pausePlayerIfUnmuted(player: MediaPlayer?) {
        player?.let { mediaPlayer ->
            if (mediaPlayer.getVolume() > MIN_PLAYER_VOLUME) {
                mediaPlayer.pause()
            }
        }
    }

    private fun duckPlayer(player: MediaPlayer?) {
        player?.let { mediaPlayer ->
            val volume = mediaPlayer.getVolume() / 2
            oldVolume = volume
            mediaPlayer.setVolume(volume)
        }
    }

    private fun unduckPlayer(player: MediaPlayer?) {
        player?.let { mediaPlayer ->
            if (mediaPlayer.getVolume() > MIN_PLAYER_VOLUME) {
                mediaPlayer.setVolume(oldVolume)
            }
        }
    }

    override fun onAudioFocusChange(focusChange: Int) {
        when (focusChange) {
            AudioManager.AUDIOFOCUS_LOSS -> {
                appContext.mainQueue.launch {
                    playerViews.forEach { view ->
                        pausePlayerIfUnmuted(view.get()?.mediaPlayer)
                    }

                    currentFocusRequest = null
                }
            }

            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                val audioMixingMode = findAudioMixingMode()

                if (audioMixingMode == AudioMixingMode.MIX_WITH_OTHERS) {
                    return
                }

                appContext.mainQueue.launch {
                    playerViews.forEach { view ->
                        pausePlayerIfUnmuted(view.get()?.mediaPlayer)
                    }

                    currentFocusRequest = null
                }
            }

            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                val audioMixingMode = findAudioMixingMode()

                appContext.mainQueue.launch {
                    playerViews.forEach { view ->
                        view.get()?.mediaPlayer?.let { player ->
                            if (audioMixingMode == AudioMixingMode.DO_NOT_MIX) {
                                pausePlayerIfUnmuted(player)
                            } else {
                                duckPlayer(player)
                            }
                        }
                    }
                }
            }

            AudioManager.AUDIOFOCUS_GAIN -> {
                appContext.mainQueue.launch {
                    playerViews.forEach { view ->
                        unduckPlayer(view.get()?.mediaPlayer)
                    }
                }
            }
        }
    }
}
