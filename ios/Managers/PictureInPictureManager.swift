import AVKit
import VLCKit

class PictureInPictureManager {
  private weak var pipView: LibVlcPlayerView?
  private var pipViewID: ObjectIdentifier?

  private var mediaPlayer: VLCMediaPlayer? {
    pipView?.mediaPlayer
  }

  func addPipView(_ view: LibVlcPlayerView) {
    if isPictureInPictureSupported(), view.pictureInPicture, view.mediaPlayer != nil {
      pipView = view
      pipViewID = ObjectIdentifier(view)
    }
  }

  func removePipView(_ viewID: ObjectIdentifier) {
    if pipViewID == viewID {
      pipView = nil
      pipViewID = nil
    }
  }

  func refreshPipView(_ view: LibVlcPlayerView) {
    if pipView !== view, canClaimPipView(view) {
      addPipView(view)
    }
  }

  private func canClaimPipView(_ view: LibVlcPlayerView) -> Bool {
    view.pictureInPicture && view.mediaPlayer?.isPlaying == true && mediaPlayer?.isPlaying != true
  }

  func isPipView(_ view: LibVlcPlayerView) -> Bool {
    pipView === view
  }

  func isPictureInPictureSupported() -> Bool {
    AVPictureInPictureController.isPictureInPictureSupported()
  }
}
