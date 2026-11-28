package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class Dialog(
  @Field val type: String = "",
  @Field val title: String = "",
  @Field val text: String = "",
  @Field val cancelText: String? = null,
  @Field val action1Text: String? = null,
  @Field val action2Text: String? = null,
) : Record,
  Serializable
