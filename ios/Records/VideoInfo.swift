import ExpoModulesCore

struct VideoInfo: Record {
  @Field
  var width: Int = 0

  @Field
  var height: Int = 0

  @Field
  var frameRate: Int = 0

  @Field
  var bitrate: Int = 0
}
