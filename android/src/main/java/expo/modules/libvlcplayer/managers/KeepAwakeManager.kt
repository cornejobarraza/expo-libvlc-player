package expo.modules.libvlcplayer.managers

import android.app.Activity
import android.view.WindowManager
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions

class KeepAwakeManager(
    private val appContext: AppContext?,
) {
    private val currentActivity: Activity
        get() = appContext?.currentActivity ?: throw Exceptions.MissingActivity()

    fun activateKeepAwake() {
        currentActivity.let { activity ->
            activity.runOnUiThread {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    fun deactivateKeepAwake() {
        currentActivity.let { activity ->
            activity.runOnUiThread {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }
}
