package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class MediaMetadata(
  @Field var title: String? = "",
  @Field var artist: String? = "",
  @Field var album: String? = "",
  @Field var artworkURL: String? = "",
) : Record,
  Serializable
