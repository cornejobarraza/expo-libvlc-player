import ExpoModulesCore

struct MediaMetadata: Record {
    @Field
    var title: String? = ""

    @Field
    var artist: String? = ""

    @Field
    var album: String? = ""

    @Field
    var artworkURL: String? = ""
}
