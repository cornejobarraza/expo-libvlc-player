package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.libvlcplayer.records.MediaTracks
import java.io.Serializable

class MediaInfo(
    @Field var width: Int = 0,
    @Field var height: Int = 0,
    @Field var tracks: MediaTracks = MediaTracks(),
    @Field var duration: Double = 0.0,
    @Field var seekable: Boolean = false,
) : Record,
    Serializable
