package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.libvlcplayer.records.MediaTrack
import java.io.Serializable

class MediaTracks(
    @Field var audio: List<MediaTrack> = emptyList(),
    @Field var video: List<MediaTrack> = emptyList(),
    @Field var subtitle: List<MediaTrack> = emptyList(),
) : Record,
    Serializable
