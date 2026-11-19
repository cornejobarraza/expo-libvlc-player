package expo.modules.libvlcplayer.utils

import androidx.fragment.app.Fragment
import expo.modules.libvlcplayer.LibVlcPlayerView
import java.lang.ref.WeakReference
import java.util.UUID

class PictureInPictureFragment(
  view: LibVlcPlayerView,
) : Fragment() {
  val id = "${PictureInPictureFragment::class.java.simpleName}_${UUID.randomUUID()}"
  private val view = WeakReference(view)

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode)

    view.get()?.let { view ->
      if (isInPictureInPictureMode) {
        view.onStartPictureInPicture()
      } else {
        view.onStopPictureInPicture()
      }
    }
  }

  override fun onStop() {
    super.onStop()

    view.get()?.let { view ->
      if (!isRemoving && !view.isPlaybackView) {
        view.pause()
      }
    }
  }
}
