import ExpoModulesCore

struct MediaInfo: Record {
    @Field
    var width: Int = 0

    @Field
    var height: Int = 0

    @Field
    var tracks: MediaTracks = .init()

    @Field
    var duration: Double = 0.0

    @Field
    var seekable: Bool = false
}
