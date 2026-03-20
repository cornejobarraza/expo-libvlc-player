import ExpoModulesCore

struct Slave: Record, Equatable {
    @Field
    var source: String = ""

    @Field
    var type: String = ""

    @Field
    var selected: Bool? = false

    // swiftformat:disable:next redundantEquatable
    static func == (lhs: Slave, rhs: Slave) -> Bool {
        lhs.source == rhs.source &&
            lhs.type == rhs.type &&
            lhs.selected == rhs.selected
    }
}
