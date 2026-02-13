package expo.modules.libvlcplayer.enums

import expo.modules.kotlin.types.Enumerable

enum class VideoContentFit(
    val value: String,
) : Enumerable {
    CONTAIN("contain"),
    COVER("cover"),
    FILL("fill"),
}
