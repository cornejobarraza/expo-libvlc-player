import ExpoModulesCore

struct SeekTarget: Record {
  @Field
  var time: Double? = nil

  @Field
  var position: Double? = nil
}
