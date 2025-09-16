package expo.modules.libvlcplayer

import expo.modules.libvlcplayer.records.Dialog
import org.videolan.libvlc.Dialog as VLCDialog

fun LibVlcPlayerView.setDialogCallbacks() {
    VLCDialog.setCallbacks(
        libVLC!!,
        object : VLCDialog.Callbacks {
            override fun onDisplay(dialog: VLCDialog.ErrorMessage) {
                vlcDialog = dialog

                val dialog =
                    Dialog(
                        title = dialog.getTitle(),
                        text = dialog.getText(),
                    )

                onDialogDisplay(dialog)
            }

            override fun onDisplay(dialog: VLCDialog.LoginDialog) {
                vlcDialog = dialog

                val dialog =
                    Dialog(
                        title = dialog.getTitle(),
                        text = dialog.getText(),
                    )

                onDialogDisplay(dialog)
            }

            override fun onDisplay(dialog: VLCDialog.QuestionDialog) {
                vlcDialog = dialog

                val dialog =
                    Dialog(
                        title = dialog.getTitle(),
                        text = dialog.getText(),
                        cancelText = dialog.getCancelText(),
                        action1Text = dialog.getAction1Text(),
                        action2Text = dialog.getAction2Text(),
                    )

                onDialogDisplay(dialog)
            }

            override fun onDisplay(dialog: VLCDialog.ProgressDialog) {}

            override fun onCanceled(dialog: VLCDialog) {}

            override fun onProgressUpdate(dialog: VLCDialog.ProgressDialog) {}
        },
    )
}
