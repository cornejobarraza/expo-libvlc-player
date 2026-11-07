package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class MediaInfo(
  @Field var video: Video = Video(),
  @Field var media: Media = Media(),
  @Field var metadata: Metadata = Metadata(),
) : Record,
  Serializable
