import ExpoModulesCore

struct Tracks: Record {
  @Field
  var audio: Int? = nil

  @Field
  var video: Int? = nil

  @Field
  var subtitle: Int? = nil
}

extension Tracks: Equatable {
  static func == (lhs: Tracks, rhs: Tracks) -> Bool {
    (lhs.audio, lhs.video, lhs.subtitle) ==
      (rhs.audio, rhs.video, rhs.subtitle)
  }
}
