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
    private val activity: Activity
        get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()
    private val fragmentActivity = activity as? FragmentActivity
    private var pipFragment: PictureInPictureFragment? = null
    private var pipReceiver: BroadcastReceiver? = null
    private var pipView: LibVlcPlayerView? = null

    private val rootChildrenVisibility: MutableMap<Int, Int> = mutableMapOf()

    private val context: Context?
        get() = pipView?.context
    private val packageName: String?
        get() = context?.packageName
    private val mediaPlayer: MediaPlayer?
        get() = pipView?.mediaPlayer
    private val isPlaying: Boolean
        get() = mediaPlayer?.isPlaying() == true
    private val pictureInPicture: Boolean
        get() = pipView?.pictureInPicture == true

    fun setupPipManager(view: LibVlcPlayerView) {
        if (!isPictureInPictureSupported()) return
        pipView = view
        setupPipFragment()
        setupPipReceiver()
        setPipParams()
        setPipActions()
    }

    private fun setupPipFragment() {
        removePipFragment()
        addPipFragment()
    }

    private fun addPipFragment() {
        fragmentActivity?.let { activity ->
            val view = pipView ?: return
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

    private fun setupPipReceiver() {
        unregisterPipReceiver()
        registerPipReceiver()
    }

    private fun registerPipReceiver() {
        pipReceiver =
            object : BroadcastReceiver() {
                override fun onReceive(
                    context: Context?,
                    intent: Intent?,
                ) {
                    mediaPlayer?.let { player ->
                        val canReceiveActions = intent != null && intent.action == MediaPlayerConstants.ACTION_PIP_CONTROL

                        if (canReceiveActions) {
                            val controlType = intent.getIntExtra(MediaPlayerConstants.EXTRA_CONTROL_TYPE, 0)

                            when (controlType) {
                                MediaPlayerConstants.EXTRA_CONTROL_REWIND -> {
                                    val time = player.getTime()

                                    if (time != -1L) {
                                        player.setTime(time - MediaPlayerConstants.SEEK_STEP_MS)
                                    }
                                }

                                MediaPlayerConstants.EXTRA_CONTROL_PLAY -> {
                                    player.play()
                                }

                                MediaPlayerConstants.EXTRA_CONTROL_PAUSE -> {
                                    player.pause()
                                }

                                MediaPlayerConstants.EXTRA_CONTROL_FORWARD -> {
                                    val time = player.getTime()

                                    if (time != -1L) {
                                        player.setTime(time + MediaPlayerConstants.SEEK_STEP_MS)
                                    }
                                }
                            }
                        }
                    }
                }
            }

        context?.registerReceiver(
            pipReceiver!!,
            IntentFilter(MediaPlayerConstants.ACTION_PIP_CONTROL),
            Context.RECEIVER_NOT_EXPORTED,
        )
    }

    private fun unregisterPipReceiver() {
        try {
            if (pipReceiver != null) {
                context?.unregisterReceiver(pipReceiver)
            }
        } catch (_: Exception) {
            // Receiver not registered
        }
    }

    fun setPipParams() {
        val view = pipView ?: return
        val texture = view.getTextureView(view.playerLayout)
        val canSetParams = isPictureInPictureSupported() && texture != null

        if (!canSetParams) return

        val ratio = Rational(texture.width, texture.height)
        val safeRatio = ratio.takeIf { it.toFloat() in 0.41841..2.39 }

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
                .setAutoEnterEnabled(pictureInPicture)
                .build()

        activity.setPictureInPictureParams(params)
    }

    fun setPipActions() {
        val canSetActions = isPictureInPictureSupported() && context != null

        if (!canSetActions) return

        val rewindControl = MediaPlayerConstants.EXTRA_CONTROL_REWIND
        val playbackControl = if (isPlaying) MediaPlayerConstants.EXTRA_CONTROL_PAUSE else MediaPlayerConstants.EXTRA_CONTROL_PLAY
        val forwardControl = MediaPlayerConstants.EXTRA_CONTROL_FORWARD

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

        val rewindIntent =
            Intent(MediaPlayerConstants.ACTION_PIP_CONTROL).apply {
                putExtra(MediaPlayerConstants.EXTRA_CONTROL_TYPE, rewindControl)
                setPackage(packageName)
            }
        val playbackIntent =
            Intent(MediaPlayerConstants.ACTION_PIP_CONTROL).apply {
                putExtra(MediaPlayerConstants.EXTRA_CONTROL_TYPE, playbackControl)
                setPackage(packageName)
            }
        val forwardIntent =
            Intent(MediaPlayerConstants.ACTION_PIP_CONTROL).apply {
                putExtra(MediaPlayerConstants.EXTRA_CONTROL_TYPE, forwardControl)
                setPackage(packageName)
            }

        val rewindPendingIntent =
            PendingIntent.getBroadcast(
                context,
                rewindControl,
                rewindIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        val playbackPendingIntent =
            PendingIntent.getBroadcast(
                context,
                playbackControl,
                playbackIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        val forwardPendingIntent =
            PendingIntent.getBroadcast(
                context,
                forwardControl,
                forwardIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )

        val actions =
            listOf(
                RemoteAction(rewindIcon, rewindTitle, rewindDescription, rewindPendingIntent),
                RemoteAction(playbackIcon, playbackTitle, playbackDescription, playbackPendingIntent),
                RemoteAction(forwardIcon, forwardTitle, forwardDescription, forwardPendingIntent),
            )

        val params =
            PictureInPictureParams
                .Builder()
                .setActions(actions)
                .setAutoEnterEnabled(pictureInPicture && isPlaying)
                .build()

        activity.setPictureInPictureParams(params)
    }

    fun layoutForPipEnter() {
        val pictureLayout = pipView?.pictureLayout ?: return
        val rootView = activity.findViewById<ViewGroup>(android.R.id.content)

        for (i in 0 until rootView.childCount) {
            val child = rootView.getChildAt(i)
            rootChildrenVisibility[child.id] = child.visibility
            rootView.getChildAt(i).visibility = View.GONE
        }

        rootView.addView(pictureLayout)

        pipView?.let { view ->
            // Picture-in-Picture (PiP) black window workaround
            view.detachPlayerLayout()
            view.attachPlayerLayout(pictureLayout)

            view.detachPlayerLayout()
            view.post { view.attachPlayerLayout(pictureLayout) }
        }
    }

    fun layoutForPipExit() {
        val playerLayout = pipView?.playerLayout ?: return
        val pictureLayout = pipView?.pictureLayout ?: return
        val rootView = activity.findViewById<ViewGroup>(android.R.id.content)

        pipView?.let { view ->
            view.detachPlayerLayout()
            view.post { view.attachPlayerLayout(playerLayout) }
        }

        rootView.removeView(pictureLayout)

        for (i in 0 until rootView.childCount) {
            val child = rootView.getChildAt(i)

            rootChildrenVisibility[child.id]?.let { visibility ->
                child.visibility = visibility
            }
        }

        rootChildrenVisibility.clear()
    }

    fun startPictureInPicture(view: LibVlcPlayerView) {
        maybeThrowPipException()
        setupPipManager(view)
        enterPictureInPicture()
    }

    private fun enterPictureInPicture() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            activity.enterPictureInPictureMode(PictureInPictureParams.Builder().build())
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            @Suppress("DEPRECATION")
            activity.enterPictureInPictureMode()
        }
    }

    private fun maybeThrowPipException() {
        if (!isPictureInPictureSupported()) {
            throw PictureInPictureUnsupportedException()
        } else if (!pictureInPicture) {
            throw PictureInPictureUnallowedException()
        }
    }

    private fun isPictureInPictureSupported(): Boolean =
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            activity.packageManager.hasSystemFeature(
                android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE,
            )
}

class PictureInPictureUnsupportedException : CodedException("Picture-in-Picture (PiP) mode is not supported on this device")

class PictureInPictureUnallowedException : CodedException("Picture-in-Picture (PiP) mode must be allowed on this player")
