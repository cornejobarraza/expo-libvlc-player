import ExpoModulesCore

struct Tracks: Record, Equatable {
    @Field
    var audio: Int = 0

    @Field
    var video: Int = 0

    @Field
    var subtitle: Int = 0

    static func == (lhs: Tracks, rhs: Tracks) -> Bool {
        lhs.audio == rhs.audio &&
            lhs.video == rhs.video &&
            lhs.subtitle == rhs.subtitle
    }
}
