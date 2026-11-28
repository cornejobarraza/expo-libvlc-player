import ExpoModulesCore

struct MediaTracks: Record {
  @Field var audio: [MediaTrack] = .init()
  @Field var video: [MediaTrack] = .init()
  @Field var subtitle: [MediaTrack] = .init()
}
