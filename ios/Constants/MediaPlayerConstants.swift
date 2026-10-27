enum MediaPlayerConstants {
  static let defaultPlayerScale: Double = 0.0
  static let defaultPlayerRate: Double = 1.0
  static let defaultPlayerTime: Int = 0
  static let minPlayerVolume: Int = 0
  static let maxPlayerVolume: Int = 100

  static let seekStep: TimeInterval = 10.0
  static let nowPlayingArtworkSize: Int = 512
  static let nowPlayingRefreshInterval: TimeInterval = 1.0

  static let expDelayMultiplier: Double = 2.0
  static let retryDelayMs: Double = 150.0
  static let maxRetryCount: Int = 2
}
