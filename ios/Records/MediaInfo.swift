import ExpoModulesCore

struct MediaInfo: Record {
    @Field
    var video: VideoInfo = .init()

    @Field
    var metadata: MediaMetadata = .init()

    @Field
    var length: Int = 0

    @Field
    var seekable: Bool = false
}
