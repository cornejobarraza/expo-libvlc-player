import AVKit
import ExpoModulesCore
import VLCKit

class PictureInPictureDrawable: MediaPlayerDrawable {
  private weak var view: LibVlcPlayerView?

  private var mediaPlayer: VLCMediaPlayer? {
    view?.mediaPlayer
  }

  private var pictureInPicture: Bool {
    view?.pictureInPicture ?? false
  }

  private weak var pipController: VLCPictureInPictureWindowControlling?

  init(_ view: LibVlcPlayerView) {
    self.view = view
    super.init()
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

  private func maybeThrowPipException() throws {
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
        guard let self, let view else { return }

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
    view?.play()
  }

  func pause() {
    view?.pause()
  }

  func seek(by offset: Int64, completion: (() -> Void)!) {
    view?.seekBy(Double(offset), picture: true)
    completion?()
  }

  func mediaLength() -> Int64 {
    Int64(view?.getLength() ?? 0)
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

private final class PictureInPictureUnsupportedException: Exception, @unchecked Sendable {
  override var reason: String {
    "Picture-in-Picture (PiP) mode is not supported on this device"
  }
}

private final class PictureInPictureUnallowedException: Exception, @unchecked Sendable {
  override var reason: String {
    "Picture-in-Picture (PiP) mode must be allowed for this player"
  }
}
