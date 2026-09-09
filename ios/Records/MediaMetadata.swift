import ExpoModulesCore

struct MediaMetadata: Record {
  @Field
  var title: String? = nil

  @Field
  var artist: String? = nil

  @Field
  var album: String? = nil

  @Field
  var artworkURL: String? = nil
}
