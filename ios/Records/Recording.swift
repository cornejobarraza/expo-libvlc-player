import ExpoModulesCore

struct Recording: Record {
    @Field
    var path: String? = ""

    @Field
    var isRecording: Bool = false
}
