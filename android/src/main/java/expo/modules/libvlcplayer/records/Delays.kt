package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

data class Delays(
  @Field val audio: Long? = null,
  @Field val subtitle: Long? = null,
) : Record,
  Serializable
