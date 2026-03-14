package expo.modules.libvlcplayer.managers

import android.app.Activity
import android.view.WindowManager
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions

class KeepAwakeManager(
    private val appContext: AppContext,
) {
    private val activity: Activity
        get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()

    private val anyPlayingView: Boolean
        get() =
            MediaPlayerManager.expoViews.any { view ->
                view.mediaPlayer?.isPlaying() == true
            }

    fun activateKeepAwake() {
        activity.let { activity ->
            activity.runOnUiThread {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    fun deactivateKeepAwake() {
        activity.let { activity ->
            activity.runOnUiThread {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    fun toggleKeepAwake() {
        if (anyPlayingView) {
            activateKeepAwake()
        } else {
            deactivateKeepAwake()
        }
    }
}
