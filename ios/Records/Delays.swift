import ExpoModulesCore

struct Delays: Record {
  @Field
  var audio: Int? = nil

  @Field
  var subtitle: Int? = nil
}

extension Delays: Equatable {
  static func == (lhs: Delays, rhs: Delays) -> Bool {
    (lhs.audio, lhs.subtitle) ==
      (rhs.audio, rhs.subtitle)
  }
}
