import ExpoModulesCore

struct Dialog: Record {
    @Field
    var title: String = ""

    @Field
    var text: String = ""

    @Field
    var cancelText: String? = ""

    @Field
    var action1Text: String? = ""

    @Field
    var action2Text: String? = ""
}
