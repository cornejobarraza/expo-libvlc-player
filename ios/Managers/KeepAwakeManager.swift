class KeepAwakeManager {
    static let shared = KeepAwakeManager()

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
}
