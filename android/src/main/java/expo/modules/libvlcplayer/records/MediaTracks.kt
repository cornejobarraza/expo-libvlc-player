package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.libvlcplayer.records.Track
import java.io.Serializable

class MediaTracks(
    @Field var audio: List<Track> = emptyList(),
    @Field var video: List<Track> = emptyList(),
    @Field var subtitle: List<Track> = emptyList(),
) : Record,
    Serializable
