package expo.modules.libvlcplayer.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

class QuestionDialog(
    @Field var title: String = "",
    @Field var text: String = "",
    @Field var cancelText: String? = "",
    @Field var action1Text: String? = "",
    @Field var action2Text: String? = "",
) : Record,
    Serializable
