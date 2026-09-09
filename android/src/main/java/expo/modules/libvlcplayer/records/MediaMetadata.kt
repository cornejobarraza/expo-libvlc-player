package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class MediaMetadata(
  @Field var title: String? = null,
  @Field var artist: String? = null,
  @Field var album: String? = null,
  @Field var artworkURL: String? = null,
) : Record,
  Serializable
