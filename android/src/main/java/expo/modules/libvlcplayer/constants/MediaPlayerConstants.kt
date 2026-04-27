package expo.modules.libvlcplayer.constants

object MediaPlayerConstants {
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

    const val COROUTINE_DELAY_MS: Long = 1_000L
    const val EXP_DELAY_MULTIPLIER: Double = 1.5
    const val RETRY_DELAY_MS: Double = 200.0
    const val MAX_RETRY_COUNT: Int = 5
}
