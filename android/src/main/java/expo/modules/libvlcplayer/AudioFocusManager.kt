package expo.modules.libvlcplayer

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.libvlcplayer.enums.AudioMixingMode
import kotlinx.coroutines.launch
import org.videolan.libvlc.MediaPlayer
import java.lang.ref.WeakReference

class AudioFocusManager(
    private val appContext: AppContext,
    private var views: MutableList<WeakReference<LibVlcPlayerView>>,
) : AudioManager.OnAudioFocusChangeListener {
    private val audioManager by lazy {
        appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: run {
            throw CodedException("Failed to get AudioFocusManager service")
        }
    }

    private var currentFocusRequest: AudioFocusRequest? = null
    private var currentMixingMode: AudioMixingMode = AudioMixingMode.MIX_WITH_OTHERS
    private val anyPlayerRequiresFocus: Boolean
        get() =
            views.toList().any { weakView ->
                weakView.get()?.let { view ->
                    playerRequiresFocus(view.mediaPlayer)
                } ?: false
            }

    private fun playerRequiresFocus(player: MediaPlayer?): Boolean {
        val mPlayer = player ?: return false
        return mPlayer.isPlaying() && mPlayer.getVolume() > MIN_PLAYER_VOLUME
    }

    private fun findAudioMixingMode(): AudioMixingMode {
        val mixingModes =
            views.toList().mapNotNull { view ->
                view.get()?.takeIf { it.mediaPlayer?.isPlaying() == true }?.audioMixingMode
            }

        if (mixingModes.isEmpty()) {
            return AudioMixingMode.MIX_WITH_OTHERS
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
            @Suppress("DEPRECATION")
            audioManager.requestAudioFocus(this, AudioManager.STREAM_MUSIC, audioFocusType)
        }

        currentMixingMode = audioMixingMode
    }

    private fun abandonAudioFocus() {
        currentFocusRequest?.let {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioManager.abandonAudioFocusRequest(it)
            } else {
                @Suppress("DEPRECATION")
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

    override fun onAudioFocusChange(focusChange: Int) {
        when (focusChange) {
            AudioManager.AUDIOFOCUS_LOSS -> {
                appContext.mainQueue.launch {
                    views.forEach { view ->
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
                    views.forEach { view ->
                        pausePlayerIfUnmuted(view.get()?.mediaPlayer)
                    }

                    currentFocusRequest = null
                }
            }

            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                val audioMixingMode = findAudioMixingMode()

                appContext.mainQueue.launch {
                    views.forEach { weakView ->
                        weakView.get()?.let { view ->
                            view.mediaPlayer?.let { player ->
                                if (audioMixingMode == AudioMixingMode.DO_NOT_MIX) {
                                    pausePlayerIfUnmuted(player)
                                } else {
                                    appContext.mainQueue.launch {
                                        val volume = player.getVolume() / 20
                                        view.userVolume = volume
                                        player.setVolume(volume)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            AudioManager.AUDIOFOCUS_GAIN -> {
                appContext.mainQueue.launch {
                    views.forEach { weakView ->
                        weakView.get()?.let { view ->
                            view.mediaPlayer?.let { player ->
                                if (player.getVolume() > MIN_PLAYER_VOLUME) {
                                    appContext.mainQueue.launch {
                                        player.setVolume(view.userVolume)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun pausePlayerIfUnmuted(player: MediaPlayer?) {
        player?.let { mediaPlayer ->
            if (mediaPlayer.getVolume() > MIN_PLAYER_VOLUME) {
                appContext.mainQueue.launch {
                    mediaPlayer.pause()
                }
            }
        }
    }
}
