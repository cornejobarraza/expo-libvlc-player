import ExpoModulesCore

struct Tracks: Record {
    @Field
    var audio: Int = 0

    @Field
    var video: Int = 0

    @Field
    var subtitle: Int = 0
}
