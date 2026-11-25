package expo.modules.libvlcplayer.managers

import android.app.Activity
import android.app.PictureInPictureParams
import android.app.RemoteAction
import android.content.Context
import android.graphics.Rect
import android.os.Build
import android.util.Rational
import android.view.View
import android.view.ViewGroup
import androidx.annotation.RequiresApi
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.libvlcplayer.LibVlcPlayerView
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
import expo.modules.libvlcplayer.utils.MediaAction
import expo.modules.libvlcplayer.utils.MediaActionReceiver
import expo.modules.libvlcplayer.utils.PictureInPictureFragment
import org.videolan.libvlc.MediaPlayer

class PictureInPictureManager(
  private val appContext: AppContext,
) {
  private val activity: Activity?
    get() = appContext.currentActivity
  private val fragmentActivity: FragmentActivity?
    get() = activity as? FragmentActivity
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private var remoteActions: Map<MediaAction, RemoteAction>? = null

  private var pipFragment: PictureInPictureFragment? = null
  private var pipReceiver: MediaActionReceiver? = null
  private var pipView: LibVlcPlayerView? = null
  private var isPipLayout: Boolean = false

  private val mediaPlayer: MediaPlayer?
    get() = pipView?.mediaPlayer
  private val pictureInPicture: Boolean
    get() = pipView?.pictureInPicture == true
  private val isInPictureInPictureMode: Boolean
    get() = activity?.isInPictureInPictureMode == true

  private val childrenVisibility: MutableMap<View, Int> = mutableMapOf()

  fun addPipView(view: LibVlcPlayerView) {
    if (isPictureInPictureSupported()) {
      switchPipView(view)
      removePipFragment()
      addPipFragment()
      unregisterPipReceiver()
      registerPipReceiver()
      updatePipParams()
      updatePipActions()
    }
  }

  private fun switchPipView(view: LibVlcPlayerView) {
    if (pipView != view) {
      layoutForPipExit()
      pipView = view
      if (isInPictureInPictureMode) layoutForPipEnter()
    }
  }

  fun removePipView(view: LibVlcPlayerView) {
    if (pipView == view) {
      exitPictureInPicture()
      layoutForPipExit()
      removePipFragment()
      unregisterPipReceiver()
      pipView = null
      resetPipParams()
    }
  }

  fun startPictureInPicture(view: LibVlcPlayerView) {
    val activity = activity ?: throw Exceptions.MissingActivity()
    maybeThrowPipException(view)
    addPipView(view)
    enterPictureInPicture(activity)
  }

  fun refreshPipView(view: LibVlcPlayerView) {
    if (pipView == null && view.pictureInPicture && view.mediaPlayer?.isPlaying() == true) {
      addPipView(view)
    } else {
      updatePipActions()
    }
  }

  fun updatePipActions() {
    val canSetActions = isPictureInPictureSupported() && pipView != null

    if (canSetActions) {
      val isPlaying = mediaPlayer?.isPlaying() == true
      val isSeekable = mediaPlayer?.isSeekable() == true

      val actions =
        MediaAction.controls(isPlaying, isSeekable).map { action ->
          getRemoteActions().getValue(action)
        }

      val params =
        PictureInPictureParams
          .Builder()
          .setActions(actions)
          .apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
              setAutoEnterEnabled(pictureInPicture && isPlaying)
            }
          }.build()

      activity?.setPictureInPictureParams(params)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  private fun getRemoteActions(): Map<MediaAction, RemoteAction> =
    remoteActions ?: MediaAction.entries
      .associateWith { action ->
        RemoteAction(
          action.createIcon(context),
          action.title,
          action.description,
          action.createPendingIntent(context, MediaPlayerConstants.PIP_ACTION_PREFIX),
        )
      }.also { actions -> remoteActions = actions }

  fun isPipView(view: LibVlcPlayerView): Boolean = pipView == view

  fun isInPipLayout(view: LibVlcPlayerView): Boolean = pipView == view && isPipLayout

  fun layoutForPipEnter(view: LibVlcPlayerView) {
    if (pipView == view) {
      layoutForPipEnter()
    }
  }

  private fun layoutForPipEnter() {
    if (!isPipLayout) {
      pipView?.let { view ->
        val parent = activity?.findViewById<ViewGroup>(android.R.id.content) ?: return

        for (i in 0 until parent.childCount) {
          val child = parent.getChildAt(i)
          childrenVisibility[child] = child.visibility
          child.visibility = View.GONE
        }

        view.switchPlayerView(view.picture)
        parent.addView(view.picture)

        isPipLayout = true
      }
    }
  }

  fun layoutForPipExit(view: LibVlcPlayerView) {
    if (pipView == view) {
      layoutForPipExit()
    }
  }

  private fun layoutForPipExit() {
    if (isPipLayout) {
      pipView?.let { view ->
        val parent = view.picture.parent as? ViewGroup ?: return

        childrenVisibility.forEach { (child, visibility) -> child.visibility = visibility }
        childrenVisibility.clear()

        view.switchPlayerView(view.video)
        parent.removeView(view.picture)

        isPipLayout = false
      }
    }
  }

  private fun addPipFragment() {
    fragmentActivity?.let { activity ->
      pipView?.let { view ->
        val fragment = PictureInPictureFragment(view)

        activity.supportFragmentManager
          .beginTransaction()
          .add(fragment, fragment.id)
          .commitAllowingStateLoss()

        pipFragment = fragment
      }
    }
  }

  private fun removePipFragment() {
    fragmentActivity?.let { activity ->
      pipFragment?.let { fragment ->
        activity.supportFragmentManager
          .beginTransaction()
          .remove(fragment)
          .commitAllowingStateLoss()

        pipFragment = null
      }
    }
  }

  private fun registerPipReceiver() {
    pipReceiver =
      MediaActionReceiver(MediaPlayerConstants.PIP_ACTION_PREFIX) { action ->
        pipView?.handleMediaAction(action)
      }.also { receiver -> receiver.register(context) }
  }

  private fun unregisterPipReceiver() {
    pipReceiver?.unregister(context)
    pipReceiver = null
  }

  private fun updatePipParams() {
    val texture = pipView?.let { view -> view.getTextureView(view.video) }
    val canSetParams = isPictureInPictureSupported() && texture != null

    if (canSetParams) {
      val ratio = Rational(texture.width, texture.height)
      val safeRatio = ratio.takeIf { ratio -> ratio.toFloat() in 0.41841..2.39 }

      val hint = Rect()
      texture.getGlobalVisibleRect(hint)

      val location = IntArray(2)
      texture.getLocationOnScreen(location)

      val height = hint.bottom - hint.top
      hint.top = location[1]
      hint.bottom = hint.top + height

      val params =
        PictureInPictureParams
          .Builder()
          .apply { safeRatio?.let { ratio -> setAspectRatio(ratio) } }
          .setSourceRectHint(hint)
          .apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
              setAutoEnterEnabled(pictureInPicture)
            }
          }.build()

      activity?.setPictureInPictureParams(params)
    }
  }

  private fun resetPipParams() {
    if (isPictureInPictureSupported()) {
      val params =
        PictureInPictureParams
          .Builder()
          .setActions(emptyList())
          .apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
              setAutoEnterEnabled(false)
            }
          }.build()

      activity?.setPictureInPictureParams(params)
    }
  }

  private fun maybeThrowPipException(view: LibVlcPlayerView) {
    if (!isPictureInPictureSupported()) {
      throw PictureInPictureUnsupportedException()
    } else if (!view.pictureInPicture) {
      throw PictureInPictureUnallowedException()
    }
  }

  private fun enterPictureInPicture(activity: Activity) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      activity.enterPictureInPictureMode(PictureInPictureParams.Builder().build())
    }
  }

  private fun exitPictureInPicture() {
    if (isInPictureInPictureMode) {
      activity?.moveTaskToBack(true)
    }
  }

  fun isPictureInPictureSupported() =
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
      activity?.packageManager?.hasSystemFeature(
        android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE,
      ) == true
}

private class PictureInPictureUnsupportedException :
  CodedException("Picture-in-Picture (PiP) mode is not supported on this device")

private class PictureInPictureUnallowedException :
  CodedException("Picture-in-Picture (PiP) mode must be allowed for this player")
