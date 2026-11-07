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
  private val remoteActions: Map<MediaAction, RemoteAction> by lazy {
    MediaAction.entries.associateWith { action ->
      RemoteAction(
        action.createIcon(context),
        action.title,
        action.description,
        action.createPendingIntent(context, MediaPlayerConstants.PIP_ACTION_PREFIX),
      )
    }
  }

  private var pipFragment: PictureInPictureFragment? = null
  private var pipReceiver: MediaActionReceiver? = null
  private var pipView: LibVlcPlayerView? = null

  private val mediaPlayer: MediaPlayer?
    get() = pipView?.mediaPlayer
  private val pictureInPicture: Boolean
    get() = pipView?.pictureInPicture == true

  private val rootChildrenVisibility: MutableMap<View, Int> = mutableMapOf()

  fun addPipView(view: LibVlcPlayerView) {
    if (isPictureInPictureSupported()) {
      pipView = view
      removePipFragment()
      addPipFragment(view)
      unregisterPipReceiver()
      registerPipReceiver()
      updatePipParams(view)
      updatePipActions()
    }
  }

  fun removePipView(view: LibVlcPlayerView) {
    if (pipView == view) {
      layoutForPipExit()
      removePipFragment()
      unregisterPipReceiver()
      pipView = null
      reassignPipView()
    }
  }

  fun startPictureInPicture(view: LibVlcPlayerView) {
    val activity = activity ?: throw Exceptions.MissingActivity()
    maybeThrowPipException(view)
    addPipView(view)
    enterPictureInPicture(activity)
  }

  fun updatePipActions() {
    val canSetActions = isPictureInPictureSupported() && pipView != null

    if (!canSetActions) return

    val isPlaying = mediaPlayer?.isPlaying() == true
    val isSeekable = mediaPlayer?.isSeekable() == true

    val actions =
      MediaAction.controls(isPlaying, isSeekable).map { action -> remoteActions.getValue(action) }

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

  private fun reassignPipView() {
    if (pipView == null) {
      val nextView = findNextView { view -> view.pictureInPicture }

      if (nextView != null) {
        addPipView(nextView)
      } else {
        resetPipParams()
      }
    }
  }

  private fun findNextView(predicate: (LibVlcPlayerView) -> Boolean): LibVlcPlayerView? {
    val views =
      MediaPlayerManager.expoViews.filter { view ->
        view.mediaPlayer != null &&
          predicate(view)
      }

    return views.firstOrNull { view -> view.mediaPlayer?.isPlaying() == true }
      ?: views.firstOrNull()
  }

  fun layoutForPipEnter(view: LibVlcPlayerView) {
    if (pipView == view) {
      layoutForPipEnter()
    }
  }

  private fun layoutForPipEnter() {
    val picture = pipView?.picture ?: return
    val rootView = activity?.findViewById<ViewGroup>(android.R.id.content) ?: return

    for (i in 0 until rootView.childCount) {
      val child = rootView.getChildAt(i)
      rootChildrenVisibility[child] = child.visibility
      child.visibility = View.GONE
    }

    rootView.addView(picture)

    pipView?.let { view ->
      view.detachPlayerView()
      view.postDelayed(
        { view.attachPlayerView(picture) },
        MediaPlayerConstants.ATTACH_DELAY_MS,
      )
    }
  }

  fun layoutForPipExit() {
    val video = pipView?.video ?: return
    val picture = pipView?.picture ?: return
    val rootView = activity?.findViewById<ViewGroup>(android.R.id.content) ?: return

    pipView?.let { view ->
      view.detachPlayerView()
      view.postDelayed(
        { view.attachPlayerView(video) },
        MediaPlayerConstants.ATTACH_DELAY_MS,
      )
    }

    rootView.removeView(picture)

    rootChildrenVisibility.forEach { (child, visibility) ->
      child.visibility = visibility
    }

    rootChildrenVisibility.clear()
  }

  fun layoutForPipExit(view: LibVlcPlayerView) {
    if (pipView == view) {
      layoutForPipExit()
    }
  }

  private fun addPipFragment(view: LibVlcPlayerView) {
    fragmentActivity?.let { activity ->
      val fragment = PictureInPictureFragment(view)

      activity.supportFragmentManager
        .beginTransaction()
        .add(fragment, fragment.id)
        .commitAllowingStateLoss()

      pipFragment = fragment
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
    val receiver = pipReceiver ?: return

    pipReceiver = null

    appContext.reactContext?.let { context -> receiver.unregister(context) }
  }

  private fun updatePipParams(view: LibVlcPlayerView) {
    val texture = view.getTextureView(view.video)
    val canSetParams = isPictureInPictureSupported() && texture != null

    if (!canSetParams) return

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
    } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      @Suppress("DEPRECATION")
      activity.enterPictureInPictureMode()
    }
  }

  private fun isPictureInPictureSupported() =
    Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
      activity?.packageManager?.hasSystemFeature(
        android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE,
      ) == true
}

private class PictureInPictureUnsupportedException :
  CodedException("Picture-in-Picture (PiP) mode is not supported on this device")

private class PictureInPictureUnallowedException :
  CodedException("Picture-in-Picture (PiP) mode must be allowed for this player")
