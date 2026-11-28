package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

data class Metadata(
  @Field val title: String? = null,
  @Field val artist: String? = null,
  @Field val album: String? = null,
  @Field val artworkURL: String? = null,
) : Record,
  Serializable
