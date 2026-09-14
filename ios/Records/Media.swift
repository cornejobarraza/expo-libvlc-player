import ExpoModulesCore

struct Media: Record {
  @Field
  var length: Int = 0

  @Field
  var seekable: Bool = false
}
