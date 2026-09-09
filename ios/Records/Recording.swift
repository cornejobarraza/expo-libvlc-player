import ExpoModulesCore

struct Recording: Record {
  @Field
  var path: String? = nil

  @Field
  var isRecording: Bool = false
}
