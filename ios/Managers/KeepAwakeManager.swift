class KeepAwakeManager {
  private var activeTags = Set<ObjectIdentifier>()

  private var isActivated: Bool {
    !activeTags.isEmpty
  }

  func toggleKeepAwake(_ view: LibVlcPlayerView) {
    updateTag(ObjectIdentifier(view), view.shouldKeepAwake)
  }

  func deactivate(_ viewID: ObjectIdentifier) {
    updateTag(viewID, false)
  }

  private func updateTag(_ viewID: ObjectIdentifier, _ active: Bool) {
    let wasActivated = isActivated

    if active {
      activeTags.insert(viewID)
    } else {
      activeTags.remove(viewID)
    }

    if isActivated != wasActivated {
      setActivated(isActivated)
    }
  }

  private func setActivated(_ activated: Bool) {
    DispatchQueue.main.async {
      UIApplication.shared.isIdleTimerDisabled = activated
    }
  }
}
