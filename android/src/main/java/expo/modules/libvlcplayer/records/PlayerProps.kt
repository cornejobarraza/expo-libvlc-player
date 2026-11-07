package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.enums.AudioMixingMode
import expo.modules.libvlcplayer.enums.VideoContentFit

class PlayerProps(
  @Field var source: String? = null,
  @Field var metadata: Metadata? = null,
  @Field var options: List<String> = emptyList(),
  @Field var slaves: List<Slave> = emptyList(),
  @Field var tracks: Tracks? = null,
  @Field var delays: Delays? = null,
  @Field var scale: Double = MediaPlayerConstants.DEFAULT_PLAYER_SCALE,
  @Field var contentFit: VideoContentFit = VideoContentFit.CONTAIN,
  @Field var rate: Double = MediaPlayerConstants.DEFAULT_PLAYER_RATE,
  @Field var time: Int = MediaPlayerConstants.DEFAULT_PLAYER_TIME,
  @Field var volume: Int = MediaPlayerConstants.MAX_PLAYER_VOLUME,
  @Field var mute: Boolean = false,
  @Field var repeat: Boolean = false,
  @Field var autoplay: Boolean = true,
  @Field var audioMixingMode: AudioMixingMode = AudioMixingMode.AUTO,
  @Field var playInBackground: Boolean = false,
  @Field var pictureInPicture: Boolean = false,
) : Record
