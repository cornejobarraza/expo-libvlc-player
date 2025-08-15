import ExpoModulesCore

struct Slave: Record {
    @Field
    var source: String = ""

    @Field
    var type: String = ""

    @Field
    var selected: Bool? = false
}
