package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.libvlcplayer.records.Track
import java.io.Serializable

class MediaTracks(
    @Field var audio: MutableList<Track> = mutableListOf(),
    @Field var video: MutableList<Track> = mutableListOf(),
    @Field var subtitle: MutableList<Track> = mutableListOf(),
) : Record,
    Serializable
