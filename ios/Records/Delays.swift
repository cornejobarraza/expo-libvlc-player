import ExpoModulesCore

struct Delays: Record, Equatable {
    @Field
    var audio: Int = 0

    @Field
    var subtitle: Int = 0

    // swiftformat:disable:next redundantEquatable
    static func == (lhs: Delays, rhs: Delays) -> Bool {
        lhs.audio == rhs.audio &&
            lhs.subtitle == rhs.subtitle
    }
}
