import ExpoModulesCore

struct Delays: Record {
  @Field
  var audio: Int? = nil

  @Field
  var subtitle: Int? = nil
}
