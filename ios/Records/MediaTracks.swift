import ExpoModulesCore

struct MediaTracks: Record {
    @Field
    var audio: [Track] = []

    @Field
    var video: [Track] = []

    @Field
    var subtitle: [Track] = []
}
