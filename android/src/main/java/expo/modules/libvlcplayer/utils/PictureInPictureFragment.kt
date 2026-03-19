package expo.modules.libvlcplayer.utils

import androidx.fragment.app.Fragment
import expo.modules.libvlcplayer.LibVlcPlayerView
import java.lang.ref.WeakReference
import java.util.UUID

class PictureInPictureFragment(
    view: LibVlcPlayerView,
) : Fragment() {
    val id = "${PictureInPictureFragment::class.java.simpleName}_${UUID.randomUUID()}"
    private val expoView = WeakReference(view)

    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode)

        expoView.get()?.let { view ->
            if (isInPictureInPictureMode) {
                view.onStartPictureInPicture()
                view.cancelPauseIf()
            } else {
                view.onStopPictureInPicture()
                view.pauseIf(view.isInBackground)
            }
        }
    }
}
