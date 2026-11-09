enum MediaPlayerConstants {
  static let playerEvents: [String] = [
    "onBuffering",
    "onPlaying",
    "onPaused",
    "onStopped",
    "onEncounteredError",
    "onDialogDisplay",
    "onDialogCanceled",
    "onTimeChanged",
    "onPositionChanged",
    "onESAdded",
    "onRecordChanged",
    "onSnapshotTaken",
    "onFirstPlay",
    "onForeground",
    "onBackground",
    "onPictureInPictureStart",
    "onPictureInPictureStop",
  ]

  static let defaultPlayerScale: Double = 0.0
  static let defaultPlayerRate: Double = 1.0
  static let defaultPlayerTime: Int = 0
  static let minPlayerVolume: Int = 0
  static let maxPlayerVolume: Int = 100

  static let dialogCustomUI: Bool = true

  static let audioBackgroundMode: String = "audio"

  static let artworkTimeout: TimeInterval = 8.0
  static let mediaArtworkSchemes: Set<String> = ["http", "https", "file"]
  static let seekStep: TimeInterval = 10.0

  static let expDelayMultiplier: Double = 2.0
  static let retryDelayMs: Double = 150.0
  static let maxRetryCount: Int = 2
}
