import ExpoModulesCore
import MobileVLCKit
import UIKit

class LibVlcPlayerView: ExpoView {
    private let playerView = UIView()

    var mediaPlayer: VLCMediaPlayer?

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        clipsToBounds = true
        playerView.backgroundColor = .black

        addSubview(playerView)
    }

    deinit {
        destroyPlayer()
    }

    override var bounds: CGRect {
        didSet {
            playerView.frame = bounds
        }
    }

    func setupPlayer() {
        destroyPlayer()
        createPlayer()
    }

    func createPlayer() {
        mediaPlayer = VLCMediaPlayer(options: options)
        mediaPlayer!.drawable = playerView
        mediaPlayer!.media = VLCMedia(url: URL(string: source)!)
        mediaPlayer!.play()
    }

    func destroyPlayer() {
        mediaPlayer?.drawable = nil
        mediaPlayer?.media = nil
        mediaPlayer = nil
    }

    var source: String = ""

    var options: [String] = .init()
}
