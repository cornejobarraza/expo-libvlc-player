import AVKit
import ExpoModulesCore
import UIKit
import VLCKit

class PictureInPictureDrawable: MediaPlayerDrawable {
    private var expoView: LibVlcPlayerView!

    private var mediaPlayer: VLCMediaPlayer? {
        expoView.mediaPlayer
    }

    private var pictureInPicture: Bool {
        expoView.pictureInPicture
    }

    private weak var pipController: VLCPictureInPictureWindowControlling?

    init(_ view: LibVlcPlayerView) {
        super.init()
        expoView = view
    }

    @available(*, unavailable)
    required init?(coder _: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func startPictureInPicture() throws {
        try maybeThrowPipException()
        pipController?.startPictureInPicture()
    }

    func stopPictureInPicture() {
        pipController?.stopPictureInPicture()
    }

    func updatePipState() {
        DispatchQueue.main.async { [weak self] in
            self?.pipController?.invalidatePlaybackState()
        }
    }

    func maybeThrowPipException() throws {
        if !AVPictureInPictureController.isPictureInPictureSupported() {
            throw PictureInPictureUnsupportedException()
        } else if !pictureInPicture {
            throw PictureInPictureUnallowedException()
        }
    }
}

extension PictureInPictureDrawable: VLCPictureInPictureDrawable {
    func mediaController() -> (any VLCPictureInPictureMediaControlling)? {
        self
    }

    func pictureInPictureReady() -> ((any VLCPictureInPictureWindowControlling)?) -> Void {
        { [weak self] controller in
            guard let self else { return }

            pipController = controller

            pipController?.stateChangeEventHandler = { [weak self] isStarted in
                guard let self, let view = expoView else { return }

                if isStarted {
                    view.onStartPictureInPicture()
                } else {
                    view.onStopPictureInPicture()
                }
            }
        }
    }
}

extension PictureInPictureDrawable: VLCPictureInPictureMediaControlling {
    func play() {
        mediaPlayer?.play()
    }

    func pause() {
        mediaPlayer?.pause()
    }

    func seek(by offset: Int64, completion: (() -> Void)!) {
        mediaPlayer?.jump(withOffset: Int32(offset), completion: completion)
    }

    func mediaLength() -> Int64 {
        mediaPlayer?.media?.length.value?.int64Value ?? 0
    }

    func mediaTime() -> Int64 {
        mediaPlayer?.time.value?.int64Value ?? 0
    }

    func isMediaSeekable() -> Bool {
        mediaPlayer?.isSeekable == true
    }

    func isMediaPlaying() -> Bool {
        mediaPlayer?.isPlaying == true
    }
}

final class PictureInPictureUnsupportedException: Exception, @unchecked Sendable {
    override var reason: String {
        "Picture-in-Picture (PiP) mode is not supported on this device"
    }
}

final class PictureInPictureUnallowedException: Exception, @unchecked Sendable {
    override var reason: String {
        "Picture-in-Picture (PiP) mode must be allowed on this player"
    }
}
