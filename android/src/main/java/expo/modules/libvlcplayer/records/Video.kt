package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class Video(
  @Field val width: Int = 0,
  @Field val height: Int = 0,
  @Field val frameRate: Double = 0.0,
  @Field val bitrate: Int = 0,
) : Record,
  Serializable
