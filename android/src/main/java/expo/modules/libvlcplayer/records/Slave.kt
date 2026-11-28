package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

data class Slave(
  @Field val source: String = "",
  @Field val type: String = "",
  @Field val selected: Boolean? = false,
) : Record,
  Serializable
