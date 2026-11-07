package expo.modules.libvlcplayer.utils

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.drawable.Icon
import androidx.core.content.ContextCompat
import expo.modules.libvlcplayer.R

enum class MediaAction(
  private val key: String,
  val iconRes: Int,
  val title: String,
  val description: String,
) {
  REWIND("rewind", R.drawable.replay_10, "Fast rewind", "Fast rewind 10s"),
  PLAY("play", R.drawable.play_arrow_24px, "Play", "Resume playback"),
  PAUSE("pause", R.drawable.pause_24px, "Pause", "Pause playback"),
  FORWARD("forward", R.drawable.forward_10, "Fast forward", "Fast forward 10s"),
  ;

  fun intentAction(prefix: String): String = "${prefix}_$key"

  fun createIcon(context: Context): Icon = Icon.createWithResource(context, iconRes)

  fun createPendingIntent(
    context: Context,
    prefix: String,
  ): PendingIntent {
    val intent = Intent(intentAction(prefix)).setPackage(context.packageName)

    return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
  }

  companion object {
    fun controls(
      isPlaying: Boolean,
      isSeekable: Boolean,
    ): List<MediaAction> {
      val playback = if (isPlaying) PAUSE else PLAY

      return if (isSeekable) listOf(REWIND, playback, FORWARD) else listOf(playback)
    }

    fun fromIntentAction(
      prefix: String,
      action: String?,
    ): MediaAction? = entries.firstOrNull { entry -> entry.intentAction(prefix) == action }
  }
}

class MediaActionReceiver(
  private val prefix: String,
  private val onAction: (MediaAction) -> Unit,
) : BroadcastReceiver() {
  override fun onReceive(
    context: Context?,
    intent: Intent?,
  ) {
    MediaAction.fromIntentAction(prefix, intent?.action)?.let(onAction)
  }

  fun register(context: Context) {
    val filter =
      IntentFilter().apply {
        MediaAction.entries.forEach { action -> addAction(action.intentAction(prefix)) }
      }

    ContextCompat.registerReceiver(context, this, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
  }

  fun unregister(context: Context) {
    try {
      context.unregisterReceiver(this)
    } catch (_: IllegalArgumentException) {
      // Receiver not registered
    }
  }
}
