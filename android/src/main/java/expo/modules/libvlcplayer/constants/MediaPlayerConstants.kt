package expo.modules.libvlcplayer.constants

import android.media.session.PlaybackState
import org.videolan.libvlc.util.DisplayManager

object MediaPlayerConstants {
  val PLAYER_EVENTS: Array<String> =
    arrayOf(
      "onBuffering",
      "onPlaying",
      "onPaused",
      "onStopped",
      "onEncounteredError",
      "onDialogDisplay",
      "onDialogCanceled",
      "onTimeChanged",
      "onPositionChanged",
      "onESAdded",
      "onRecordChanged",
      "onSnapshotTaken",
      "onFirstPlay",
      "onForeground",
      "onBackground",
      "onPictureInPictureStart",
      "onPictureInPictureStop",
    )

  const val SOURCE_CACHE_DIR: String = "ExpoLibVlcPlayer"

  const val DEFAULT_PLAYER_SCALE: Double = 0.0
  const val DEFAULT_PLAYER_RATE: Double = 1.0
  const val DEFAULT_PLAYER_TIME: Int = 0
  const val MIN_PLAYER_VOLUME: Int = 0
  const val MAX_PLAYER_VOLUME: Int = 100
  const val SEEK_STEP_MS: Long = 10_000L

  val DISPLAY_MANAGER: DisplayManager? = null
  const val ENABLE_SUBTITLES: Boolean = true
  const val USE_TEXTURE_VIEW: Boolean = true

  const val ARTWORK_TIMEOUT_MS: Int = 8_000
  val MEDIA_ARTWORK_SCHEMES: Set<String> = setOf("http", "https", "file")

  const val MEDIA_ACTIONS_PLAY_PAUSE: Long =
    PlaybackState.ACTION_PLAY or
      PlaybackState.ACTION_PAUSE or
      PlaybackState.ACTION_PLAY_PAUSE
  const val MEDIA_ACTIONS_SEEK: Long =
    PlaybackState.ACTION_SEEK_TO or
      PlaybackState.ACTION_REWIND or
      PlaybackState.ACTION_FAST_FORWARD

  const val MEDIA_CHANNEL_ID: String = "ExpoLibVlcPlayer"
  const val MEDIA_CHANNEL_NAME: String = "Now Playing"
  const val MEDIA_NOTIFICATION_ID: Int = 0x564C43 // VLC
  const val MEDIA_NOTIFICATION_ACTION_PREFIX: String = "media_notification"
  const val MEDIA_NOTIFICATION_DISMISS_ACTION: String =
    "${MEDIA_NOTIFICATION_ACTION_PREFIX}_dismiss"
  const val FOREGROUND_TIMEOUT_MS: Long = 600_000L

  const val PIP_ACTION_PREFIX: String = "pip_action"

  const val ATTACH_DELAY_MS: Long = 300L
  const val PAUSE_DELAY_MS: Long = 1_000L
  const val EXP_DELAY_MULTIPLIER: Double = 2.0
  const val RETRY_DELAY_MS: Double = 150.0
  const val MAX_RETRY_COUNT: Int = 2
}
