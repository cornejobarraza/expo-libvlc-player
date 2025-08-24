import Foundation

class MediaPlayerManager {
    static let shared = MediaPlayerManager()

    let playerViews = NSHashTable<LibVlcPlayerView>.weakObjects()

    func onModuleDestroyed() {
        for view in playerViews.allObjects {
            view.destroyPlayer()
        }
    }

    func registerPlayerView(_ view: LibVlcPlayerView) {
        playerViews.add(view)
    }

    func unregisterPlayerView(_ view: LibVlcPlayerView) {
        playerViews.remove(view)
    }

    func onAppBackground() {
        for view in playerViews.allObjects {
            view.onBackground([:])

            if let player = view.mediaPlayer {
                let shouldPause = !view.playInBackground && player.isPlaying

                if shouldPause {
                    player.pause()
                }
            }
        }
    }
}
