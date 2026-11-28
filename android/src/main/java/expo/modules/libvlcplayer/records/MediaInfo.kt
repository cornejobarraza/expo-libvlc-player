package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class MediaInfo(
  @Field val media: Media = Media(),
  @Field val video: Video = Video(),
  @Field val metadata: Metadata = Metadata(),
) : Record,
  Serializable
