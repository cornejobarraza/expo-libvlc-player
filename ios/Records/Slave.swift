import ExpoModulesCore

struct Slave: Record {
  @Field
  var source: String = ""

  @Field
  var type: String = ""

  @Field
  var selected: Bool? = false
}

extension Slave: Equatable {
  static func == (lhs: Slave, rhs: Slave) -> Bool {
    (lhs.source, lhs.type, lhs.selected) ==
      (rhs.source, rhs.type, rhs.selected)
  }
}
