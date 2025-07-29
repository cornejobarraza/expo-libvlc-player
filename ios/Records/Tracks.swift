import ExpoModulesCore

struct Tracks: Record {
    @Field
    var audio: Int

    @Field
    var video: Int

    @Field
    var subtitle: Int
}
