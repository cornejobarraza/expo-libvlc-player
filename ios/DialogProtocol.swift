import MobileVLCKit

extension LibVlcPlayerView: VLCCustomDialogRendererProtocol {
    func showError(
        withTitle _: String,
        message _: String
    ) {}

    func showLogin(
        withTitle _: String,
        message _: String,
        defaultUsername _: String?,
        askingForStorage _: Bool,
        withReference _: NSValue
    ) {}

    func showQuestion(
        withTitle title: String,
        message: String,
        type _: VLCDialogQuestionType,
        cancel: String?,
        action1String: String?,
        action2String: String?,
        withReference dialogReference: NSValue
    ) {
        reference = dialogReference

        let dialog = Dialog(
            title: title,
            text: message,
            cancelText: cancel,
            action1Text: action1String,
            action2Text: action2String
        )

        onDialogDisplay(dialog)
    }

    func showProgress(
        withTitle _: String,
        message _: String,
        isIndeterminate _: Bool,
        position _: Float,
        cancel _: String?,
        withReference _: NSValue
    ) {}

    func updateProgress(
        withReference _: NSValue,
        message _: String?,
        position _: Float
    ) {}

    func cancelDialog(withReference _: NSValue) {
        reference = nil
        question = nil
    }
}
