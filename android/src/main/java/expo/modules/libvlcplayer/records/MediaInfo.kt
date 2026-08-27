package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class MediaInfo(
    @Field var video: VideoInfo = VideoInfo(),
    @Field var metadata: MediaMetadata = MediaMetadata(),
    @Field var length: Int = 0,
    @Field var seekable: Boolean = false,
) : Record,
    Serializable
