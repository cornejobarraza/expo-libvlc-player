import ExpoModulesCore

struct MediaInfo: Record {
  @Field
  var media: Media = .init()

  @Field
  var video: Video = .init()

  @Field
  var metadata: Metadata = .init()
}
