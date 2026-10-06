import VLCKit

class VLCDialog {
  private let provider: VLCDialogProvider?

  init(_ provider: VLCDialogProvider?) {
    self.provider = provider
  }

  func dismiss() {}

  class IdDialog: VLCDialog {
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

  final class LoginDialog: IdDialog {
    func postLogin(_ username: String, _ password: String, _ store: Bool) {
      provider?.postUsername(
        username,
        andPassword: password,
        forDialogReference: reference,
        store: store
      )
    }
  }

  final class QuestionDialog: IdDialog {
    func postAction(_ action: Int) {
      provider?.postAction(Int32(action), forDialogReference: reference)
    }
  }
}
