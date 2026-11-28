import ExpoModulesCore

struct Video: Record {
  @Field var width: Int = 0
  @Field var height: Int = 0
  @Field var frameRate: Double = 0.0
  @Field var bitrate: Int = 0
}
