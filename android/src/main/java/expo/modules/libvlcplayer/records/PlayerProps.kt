package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.enums.AudioMixingMode
import expo.modules.libvlcplayer.enums.VideoContentFit

class PlayerProps(
  @Field val source: String? = null,
  @Field val metadata: Metadata? = null,
  @Field val options: List<String> = emptyList(),
  @Field val slaves: List<Slave> = emptyList(),
  @Field val tracks: Tracks? = null,
  @Field val delays: Delays? = null,
  @Field val scale: Double = MediaPlayerConstants.DEFAULT_PLAYER_SCALE,
  @Field val contentFit: VideoContentFit = VideoContentFit.CONTAIN,
  @Field val rate: Double = MediaPlayerConstants.DEFAULT_PLAYER_RATE,
  @Field val time: Int = MediaPlayerConstants.DEFAULT_PLAYER_TIME,
  @Field val volume: Int = MediaPlayerConstants.MAX_PLAYER_VOLUME,
  @Field val mute: Boolean = false,
  @Field val repeat: Boolean = false,
  @Field val autoplay: Boolean = true,
  @Field val audioMixingMode: AudioMixingMode = AudioMixingMode.AUTO,
  @Field val keepScreenAwake: Boolean = true,
  @Field val playInBackground: Boolean = false,
  @Field val pictureInPicture: Boolean = false,
) : Record
