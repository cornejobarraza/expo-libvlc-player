package expo.modules.libvlcplayer

import expo.modules.libvlcplayer.records.QuestionDialog
import org.videolan.libvlc.Dialog

fun LibVlcPlayerView.setDialogCallbacks() {
    Dialog.setCallbacks(
        libVLC!!,
        object : Dialog.Callbacks {
            override fun onDisplay(dialog: Dialog.ErrorMessage) {}

            override fun onDisplay(dialog: Dialog.LoginDialog) {}

            override fun onDisplay(dialog: Dialog.QuestionDialog) {
                question = dialog

                val dialog =
                    QuestionDialog(
                        title = dialog.getTitle(),
                        text = dialog.getText(),
                        cancelText = dialog.getCancelText(),
                        action1Text = dialog.getAction1Text(),
                        action2Text = dialog.getAction2Text(),
                    )

                onDialogDisplay(dialog)
            }

            override fun onDisplay(dialog: Dialog.ProgressDialog) {}

            override fun onCanceled(dialog: Dialog) {
                question = null
            }

            override fun onProgressUpdate(dialog: Dialog.ProgressDialog) {}
        },
    )
}
