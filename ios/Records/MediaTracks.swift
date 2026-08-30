import ExpoModulesCore

struct MediaTracks: Record {
  @Field
  var audio: [MediaTrack] = []

  @Field
  var video: [MediaTrack] = []

  @Field
  var subtitle: [MediaTrack] = []
}
