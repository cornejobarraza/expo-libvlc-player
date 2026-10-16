package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class Delays(
  @Field var audio: Long? = null,
  @Field var subtitle: Long? = null,
) : Record,
  Serializable
