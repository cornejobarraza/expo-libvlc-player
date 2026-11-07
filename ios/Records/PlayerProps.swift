import ExpoModulesCore

struct PlayerProps: Record {
  @Field
  var source: String? = nil

  @Field
  var metadata: Metadata? = nil

  @Field
  var options: [String] = .init()

  @Field
  var slaves: [Slave] = .init()

  @Field
  var tracks: Tracks? = nil

  @Field
  var delays: Delays? = nil

  @Field
  var scale: Double = MediaPlayerConstants.defaultPlayerScale

  @Field
  var contentFit: VideoContentFit = .contain

  @Field
  var rate: Double = MediaPlayerConstants.defaultPlayerRate

  @Field
  var time: Int = MediaPlayerConstants.defaultPlayerTime

  @Field
  var volume: Int = MediaPlayerConstants.maxPlayerVolume

  @Field
  var mute: Bool = false

  @Field
  var `repeat`: Bool = false

  @Field
  var autoplay: Bool = true

  @Field
  var audioMixingMode: AudioMixingMode = .auto

  @Field
  var playInBackground: Bool = false

  @Field
  var pictureInPicture: Bool = false
}
