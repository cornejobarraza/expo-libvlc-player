import ExpoModulesCore

struct Dialog: Record {
  @Field
  var title: String = ""

  @Field
  var text: String = ""

  @Field
  var type: String = ""

  @Field
  var cancelText: String? = nil

  @Field
  var action1Text: String? = nil

  @Field
  var action2Text: String? = nil
}
