import VLCKit

class VLCDialog {
  private let provider: VLCDialogProvider?

  init(_ provider: VLCDialogProvider?) {
    self.provider = provider
  }

  func dismiss() {}

  class Dialog: VLCDialog {
    let reference: NSValue

    init(_ provider: VLCDialogProvider?, _ reference: NSValue) {
      self.reference = reference
      super.init(provider)
    }

    override func dismiss() {
      provider?.dismissDialog(withReference: reference)
    }
  }

  final class ErrorMessage: VLCDialog {}

  final class LoginDialog: Dialog {
    func postLogin(_ username: String, _ password: String, _ store: Bool) {
      provider?.postUsername(
        username,
        andPassword: password,
        forDialogReference: reference,
        store: store
      )
    }
  }

  final class QuestionDialog: Dialog {
    func postAction(_ action: Int) {
      provider?.postAction(Int32(action), forDialogReference: reference)
    }
  }

  final class ProgressDialog: Dialog {}
}
