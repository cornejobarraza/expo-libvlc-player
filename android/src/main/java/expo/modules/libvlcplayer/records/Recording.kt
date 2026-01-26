package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class Recording(
    @Field val path: String? = "",
    @Field val isRecording: Boolean = false,
) : Record,
    Serializable
