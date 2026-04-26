import ExpoModulesCore

struct MediaInfo: Record {
    @Field
    var width: Int = 0

    @Field
    var height: Int = 0

    @Field
    var length: Int = 0

    @Field
    var seekable: Bool = false
}
