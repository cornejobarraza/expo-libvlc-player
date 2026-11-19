package expo.modules.libvlcplayer.managers

import android.app.Activity
import android.view.WindowManager
import expo.modules.kotlin.AppContext
import expo.modules.libvlcplayer.LibVlcPlayerView

class KeepAwakeManager(
  private val appContext: AppContext,
) {
  private val tags: MutableSet<LibVlcPlayerView> = mutableSetOf()

  private val activity: Activity?
    get() = appContext.currentActivity

  private val isActivated: Boolean
    get() = tags.isNotEmpty()

  fun toggleKeepAwake(view: LibVlcPlayerView) {
    updateTag(view, view.shouldKeepAwake)
  }

  fun deactivate(view: LibVlcPlayerView) {
    updateTag(view, false)
  }

  private fun updateTag(
    view: LibVlcPlayerView,
    active: Boolean,
  ) {
    val wasActivated = isActivated

    if (active) {
      tags.add(view)
    } else {
      tags.remove(view)
    }

    if (isActivated != wasActivated) {
      setActivated(isActivated)
    }
  }

  private fun setActivated(activated: Boolean) {
    activity?.let { activity ->
      activity.runOnUiThread {
        if (activated) {
          activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
          activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
      }
    }
  }
}
