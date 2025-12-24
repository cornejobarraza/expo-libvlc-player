#if os(tvOS)
    import TVVLCKit
#else
    import MobileVLCKit
#endif

extension LibVlcPlayerView: VLCCustomDialogRendererProtocol {
    func showError(
        withTitle title: String,
        message: String
    ) {
        let dialog = Dialog(
            title: title,
            text: message,
        )

        onDialogDisplay(dialog)
    }

    func showLogin(
        withTitle title: String,
        message: String,
        defaultUsername _: String?,
        askingForStorage _: Bool,
        withReference reference: NSValue
    ) {
        vlcDialogRef = reference

        let dialog = Dialog(
            title: title,
            text: message,
        )

        onDialogDisplay(dialog)
    }

    func showQuestion(
        withTitle title: String,
        message: String,
        type _: VLCDialogQuestionType,
        cancel: String?,
        action1String: String?,
        action2String: String?,
        withReference reference: NSValue
    ) {
        vlcDialogRef = reference

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

    func cancelDialog(withReference _: NSValue) {}
}
