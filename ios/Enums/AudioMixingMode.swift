import ExpoModulesCore

enum AudioMixingMode: String, Enumerable {
  case mixWithOthers
  case duckOthers
  case doNotMix
  case auto

  func priority() -> Int {
    switch self {
    case .doNotMix:
      3
    case .auto:
      2
    case .duckOthers:
      1
    case .mixWithOthers:
      0
    }
  }
}
