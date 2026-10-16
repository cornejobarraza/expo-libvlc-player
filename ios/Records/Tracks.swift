import ExpoModulesCore

struct Tracks: Record {
  @Field
  var audio: Int? = nil

  @Field
  var video: Int? = nil

  @Field
  var subtitle: Int? = nil
}
