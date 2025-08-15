package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class Slave(
    @Field var source: String = "",
    @Field var type: String = "",
    @Field var selected: Boolean? = false,
) : Record,
    Serializable
