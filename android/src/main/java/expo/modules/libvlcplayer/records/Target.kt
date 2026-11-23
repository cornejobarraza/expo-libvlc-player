package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

data class Target(
  @Field var time: Double? = null,
  @Field var position: Double? = null,
) : Record,
  Serializable
