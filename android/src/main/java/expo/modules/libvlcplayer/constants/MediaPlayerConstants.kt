package expo.modules.libvlcplayer.constants

object MediaPlayerConstants {
  const val SOURCE_CACHE_DIR: String = "ExpoLibVlcPlayer"

  const val DEFAULT_PLAYER_SCALE: Double = 0.0
  const val DEFAULT_PLAYER_RATE: Double = 1.0
  const val DEFAULT_PLAYER_TIME: Int = 0
  const val MIN_PLAYER_VOLUME: Int = 0
  const val MAX_PLAYER_VOLUME: Int = 100
  const val SEEK_STEP_MS: Long = 10_000L

  const val PIP_ACTION_REWIND: String = "pip_action_rewind"
  const val PIP_ACTION_PLAY: String = "pip_action_play"
  const val PIP_ACTION_PAUSE: String = "pip_action_pause"
  const val PIP_ACTION_FORWARD: String = "pip_action_forward"

  const val ATTACH_DELAY_MS: Long = 300L
  const val PAUSE_DELAY_MS: Long = 1_000L
  const val EXP_DELAY_MULTIPLIER: Double = 2.0
  const val RETRY_DELAY_MS: Double = 150.0
  const val MAX_RETRY_COUNT: Int = 2
}
