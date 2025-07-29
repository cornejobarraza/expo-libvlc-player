package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

data class Track(
    @Field val id: Int,
    @Field val name: String,
) : Record,
    Serializable
