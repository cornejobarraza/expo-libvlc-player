import Foundation

class MediaPlayerManager {
    static let shared = MediaPlayerManager()

    let localNetworkManager = LocalNetworkManager()
    let audioSessionManager = AudioSessionManager()
    let keepAwakeManager = KeepAwakeManager()

    let expoViews = NSHashTable<LibVlcPlayerView>.weakObjects()

    func registerExpoView(_ view: LibVlcPlayerView) {
        expoViews.add(view)
    }

    func unregisterExpoView(_ view: LibVlcPlayerView) {
        expoViews.remove(view)
    }

    func onModuleDestroy() {
        for view in expoViews.allObjects {
            view.destroyPlayer()
        }
    }

    func onModuleForeground() {
        for view in expoViews.allObjects {
            view.onForeground()
        }
    }

    func onModuleBackground() {
        for view in expoViews.allObjects {
            view.onBackground()
            view.pauseIf()
        }
    }
}
