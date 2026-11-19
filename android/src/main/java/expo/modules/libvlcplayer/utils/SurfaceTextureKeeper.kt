package expo.modules.libvlcplayer.utils

import android.graphics.SurfaceTexture
import android.view.TextureView
import android.view.View

class SurfaceTextureKeeper(
  private val textureView: TextureView,
) : TextureView.SurfaceTextureListener,
  View.OnAttachStateChangeListener {
  private val listener: TextureView.SurfaceTextureListener? = textureView.surfaceTextureListener
  private var surfaceTexture: SurfaceTexture? = null

  init {
    textureView.surfaceTextureListener = this
    textureView.addOnAttachStateChangeListener(this)
  }

  override fun onSurfaceTextureAvailable(
    surface: SurfaceTexture,
    width: Int,
    height: Int,
  ) {
    listener?.onSurfaceTextureAvailable(surface, width, height)
  }

  override fun onSurfaceTextureSizeChanged(
    surface: SurfaceTexture,
    width: Int,
    height: Int,
  ) = Unit

  override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean {
    surfaceTexture = surface
    return false
  }

  override fun onSurfaceTextureUpdated(surface: SurfaceTexture) = Unit

  override fun onViewAttachedToWindow(view: View) {
    val surface = surfaceTexture ?: return
    textureView.setSurfaceTexture(surface)
    surfaceTexture = null
  }

  override fun onViewDetachedFromWindow(view: View) = Unit

  fun release() {
    textureView.removeOnAttachStateChangeListener(this)
    surfaceTexture?.release()
    surfaceTexture = null
  }
}
