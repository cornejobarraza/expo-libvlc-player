package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class VideoInfo(
  @Field var width: Int = 0,
  @Field var height: Int = 0,
  @Field var frameRate: Int = 0,
  @Field var bitrate: Int = 0,
) : Record,
  Serializable
