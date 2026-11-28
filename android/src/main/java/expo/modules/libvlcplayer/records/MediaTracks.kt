package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class MediaTracks(
  @Field val audio: List<MediaTrack> = emptyList(),
  @Field val video: List<MediaTrack> = emptyList(),
  @Field val subtitle: List<MediaTrack> = emptyList(),
) : Record,
  Serializable
