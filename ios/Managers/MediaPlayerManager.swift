import Foundation

class MediaPlayerManager {
    static let shared = MediaPlayerManager()

    let localNetworkManager = LocalNetworkManager()
    let audioSessionManager = AudioSessionManager()
    let keepAwakeManager = KeepAwakeManager()

    let playerViews = NSHashTable<LibVlcPlayerView>.weakObjects()

    func registerPlayerView(_ view: LibVlcPlayerView) {
        playerViews.add(view)
    }

    func unregisterPlayerView(_ view: LibVlcPlayerView) {
        playerViews.remove(view)
    }

    func onModuleDestroy() {
        for view in playerViews.allObjects {
            view.destroyPlayer()
        }
    }

    func onModuleForeground() {
        for view in playerViews.allObjects {
            view.onForeground()
        }
    }

    func onModuleBackground() {
        for view in playerViews.allObjects {
            view.onBackground()

            if let player = view.mediaPlayer {
                let shouldPause = !view.playInBackground && player.isPlaying

                if shouldPause {
                    player.pause()
                }
            }
        }
    }
}
