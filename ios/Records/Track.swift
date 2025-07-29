import ExpoModulesCore

struct Track: Record {
    @Field
    var id: Int

    @Field
    var name: String

    init(id: Int, name: String) {
        self.id = id
        self.name = name
    }
}
