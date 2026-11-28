package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

data class Tracks(
  @Field val audio: Int? = null,
  @Field val video: Int? = null,
  @Field val subtitle: Int? = null,
) : Record,
  Serializable
