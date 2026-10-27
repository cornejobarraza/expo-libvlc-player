package expo.modules.libvlcplayer.constants

object MediaPlayerConstants {
  const val SOURCE_CACHE_DIR: String = "ExpoLibVlcPlayer"

  const val DEFAULT_PLAYER_SCALE: Double = 0.0
  const val DEFAULT_PLAYER_RATE: Double = 1.0
  const val DEFAULT_PLAYER_TIME: Int = 0
  const val MIN_PLAYER_VOLUME: Int = 0
  const val MAX_PLAYER_VOLUME: Int = 100

  const val ACTION_PIP_CONTROL: String = "pip_control"
  const val EXTRA_CONTROL_TYPE: String = "control_type"
  const val EXTRA_CONTROL_REWIND: Int = 1
  const val EXTRA_CONTROL_PLAY: Int = 2
  const val EXTRA_CONTROL_PAUSE: Int = 3
  const val EXTRA_CONTROL_FORWARD: Int = 4
  const val SEEK_STEP_MS: Long = 10_000L

  const val NOW_PLAYING_CHANNEL_ID: String = "expo-libvlc-player"
  const val NOW_PLAYING_NOTIFICATION_ID: Int = 0x564C43
  const val NOW_PLAYING_ARTWORK_SIZE: Int = 512
  const val NOW_PLAYING_REFRESH_MS: Long = 1_000L
  const val ACTION_NOW_PLAYING_PLAY_PAUSE: String = "now_playing_play_pause"
  const val ACTION_NOW_PLAYING_REWIND: String = "now_playing_rewind"
  const val ACTION_NOW_PLAYING_FORWARD: String = "now_playing_forward"

  const val ATTACH_DELAY_MS: Long = 300L
  const val PAUSE_DELAY_MS: Long = 1_000L
  const val EXP_DELAY_MULTIPLIER: Double = 2.0
  const val RETRY_DELAY_MS: Double = 150.0
  const val MAX_RETRY_COUNT: Int = 2
}
