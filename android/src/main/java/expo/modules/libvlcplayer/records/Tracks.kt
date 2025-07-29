package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class Tracks(
    @Field var audio: Int,
    @Field var video: Int,
    @Field var subtitle: Int,
) : Record,
    Serializable
