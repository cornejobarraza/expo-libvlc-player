package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class Tracks(
    @Field var audio: Int = 0,
    @Field var video: Int = 0,
    @Field var subtitle: Int = 0,
) : Record,
    Serializable
