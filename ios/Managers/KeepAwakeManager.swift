class KeepAwakeManager {
    static let shared = KeepAwakeManager()

    private lazy var anyPlayingView = MediaPlayerManager.shared.playerViews.allObjects.contains { view in
        view.mediaPlayer?.isPlaying == true
    }

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
        if anyPlayingView {
            activateKeepAwake()
        } else {
            deactivateKeepAwake()
        }
    }
}
