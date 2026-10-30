package expo.modules.libvlcplayer.managers

import android.app.Activity
import android.app.PendingIntent
import android.app.PictureInPictureParams
import android.app.RemoteAction
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Rect
import android.graphics.drawable.Icon
import android.os.Build
import android.util.Rational
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.libvlcplayer.LibVlcPlayerView
import expo.modules.libvlcplayer.R
import expo.modules.libvlcplayer.constants.MediaPlayerConstants
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
  private val packageName: String
    get() = context.packageName

  private var pipFragment: PictureInPictureFragment? = null
  private var pipReceiver: BroadcastReceiver? = null
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
      removePipFragment()
      unregisterPipReceiver()
      pipView = null
      findNextPipView(view)?.let { nextView -> addPipView(nextView) }
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

    val rewindControl = MediaPlayerConstants.PIP_ACTION_REWIND
    val playbackControl =
      if (isPlaying) {
        MediaPlayerConstants.PIP_ACTION_PAUSE
      } else {
        MediaPlayerConstants.PIP_ACTION_PLAY
      }
    val forwardControl = MediaPlayerConstants.PIP_ACTION_FORWARD

    val rewindRes = R.drawable.fast_rewind_24px
    val rewindIcon = Icon.createWithResource(context, rewindRes)
    val rewindTitle = "Fast rewind"
    val rewindDescription = "Fast rewind 10s"

    val playbackRes = if (isPlaying) R.drawable.pause_24px else R.drawable.play_arrow_24px
    val playbackIcon = Icon.createWithResource(context, playbackRes)
    val playbackTitle = if (isPlaying) "Pause" else "Play"
    val playbackDescription = if (isPlaying) "Pause playback" else "Resume playback"

    val forwardRes = R.drawable.fast_forward_24px
    val forwardIcon = Icon.createWithResource(context, forwardRes)
    val forwardTitle = "Fast forward"
    val forwardDescription = "Fast forward 10s"

    val rewindIntent = Intent(rewindControl).setPackage(packageName)
    val playbackIntent = Intent(playbackControl).setPackage(packageName)
    val forwardIntent = Intent(forwardControl).setPackage(packageName)

    val rewindPendingIntent =
      PendingIntent.getBroadcast(
        context,
        0,
        rewindIntent,
        PendingIntent.FLAG_IMMUTABLE,
      )
    val playbackPendingIntent =
      PendingIntent.getBroadcast(
        context,
        0,
        playbackIntent,
        PendingIntent.FLAG_IMMUTABLE,
      )
    val forwardPendingIntent =
      PendingIntent.getBroadcast(
        context,
        0,
        forwardIntent,
        PendingIntent.FLAG_IMMUTABLE,
      )

    val actions =
      listOf(
        RemoteAction(rewindIcon, rewindTitle, rewindDescription, rewindPendingIntent),
        RemoteAction(
          playbackIcon,
          playbackTitle,
          playbackDescription,
          playbackPendingIntent,
        ),
        RemoteAction(forwardIcon, forwardTitle, forwardDescription, forwardPendingIntent),
      )

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

  private fun findNextPipView(view: LibVlcPlayerView): LibVlcPlayerView? {
    val views =
      MediaPlayerManager.expoViews.filter { nextView ->
        nextView != view && nextView.pictureInPicture && nextView.mediaPlayer != null
      }

    return views.firstOrNull { nextView -> nextView.mediaPlayer?.isPlaying() == true }
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
      val fragment = pipFragment ?: return

      activity.supportFragmentManager
        .beginTransaction()
        .remove(fragment)
        .commitAllowingStateLoss()

      pipFragment = null
    }
  }

  private fun registerPipReceiver() {
    pipReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(
          context: Context?,
          intent: Intent?,
        ) {
          mediaPlayer?.let { player ->
            when (intent?.action) {
              MediaPlayerConstants.PIP_ACTION_REWIND -> {
                player.setTime(
                  player.getTime() - MediaPlayerConstants.SEEK_STEP_MS,
                )
              }

              MediaPlayerConstants.PIP_ACTION_PLAY -> {
                player.play()
              }

              MediaPlayerConstants.PIP_ACTION_PAUSE -> {
                player.pause()
              }

              MediaPlayerConstants.PIP_ACTION_FORWARD -> {
                player.setTime(
                  player.getTime() + MediaPlayerConstants.SEEK_STEP_MS,
                )
              }
            }
          }
        }
      }

    ContextCompat.registerReceiver(
      context,
      pipReceiver!!,
      IntentFilter().apply {
        addAction(MediaPlayerConstants.PIP_ACTION_REWIND)
        addAction(MediaPlayerConstants.PIP_ACTION_PLAY)
        addAction(MediaPlayerConstants.PIP_ACTION_PAUSE)
        addAction(MediaPlayerConstants.PIP_ACTION_FORWARD)
      },
      ContextCompat.RECEIVER_NOT_EXPORTED,
    )
  }

  private fun unregisterPipReceiver() {
    try {
      if (pipReceiver != null) {
        context.unregisterReceiver(pipReceiver)
        pipReceiver = null
      }
    } catch (_: Exception) {
      // Receiver not registered
    }
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
