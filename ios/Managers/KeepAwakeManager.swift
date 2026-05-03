class KeepAwakeManager {
    static let shared = KeepAwakeManager()

    private lazy var expoViews = MediaPlayerManager.shared.expoViews

    func activateKeepAwake() {
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = true
        }
    }

    func deactivateKeepAwake() {
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = false
        }
    }

    func toggleKeepAwake() {
        let anyPlayingView = expoViews.allObjects.contains { view in
            view.mediaPlayer?.isPlaying == true
        }

        if anyPlayingView {
            activateKeepAwake()
        } else {
            deactivateKeepAwake()
        }
    }
}
