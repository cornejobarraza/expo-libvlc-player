package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class Tracks(
  @Field var audio: Int? = null,
  @Field var video: Int? = null,
  @Field var subtitle: Int? = null,
) : Record,
  Serializable
