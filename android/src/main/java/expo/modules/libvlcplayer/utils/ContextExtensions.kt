package expo.modules.libvlcplayer.utils

import android.content.BroadcastReceiver
import android.content.Context
import android.content.IntentFilter
import android.os.Build

@Suppress("UnspecifiedRegisterReceiverFlag")
internal fun Context.registerNotExportedReceiver(
  receiver: BroadcastReceiver,
  filter: IntentFilter,
) {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
  } else {
    registerReceiver(receiver, filter)
  }
}
