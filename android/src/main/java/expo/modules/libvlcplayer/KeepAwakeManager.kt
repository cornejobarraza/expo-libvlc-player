package expo.modules.libvlcplayer

import android.app.Activity
import android.view.WindowManager
import expo.modules.core.errors.CurrentActivityNotFoundException
import expo.modules.kotlin.AppContext

class KeepAwakeManager(
    private val appContext: AppContext?,
) {
    private val currentActivity: Activity
        get() = appContext?.currentActivity ?: throw CurrentActivityNotFoundException()

    fun activateKeepAwake() {
        currentActivity.let {
            it.runOnUiThread {
                it.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    fun deactivateKeepAwake() {
        currentActivity.let {
            it.runOnUiThread {
                it.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }
}
