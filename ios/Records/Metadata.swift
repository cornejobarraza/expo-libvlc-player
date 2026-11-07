import ExpoModulesCore

struct Metadata: Record {
  @Field
  var title: String? = nil

  @Field
  var artist: String? = nil

  @Field
  var album: String? = nil

  @Field
  var artworkURL: String? = nil
}

extension Metadata: Equatable {
  static func == (lhs: Metadata, rhs: Metadata) -> Bool {
    (lhs.title, lhs.artist, lhs.album, lhs.artworkURL) ==
      (rhs.title, rhs.artist, rhs.album, rhs.artworkURL)
  }
}
