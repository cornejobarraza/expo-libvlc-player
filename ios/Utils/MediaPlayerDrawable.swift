class MediaPlayerDrawable: UIView {
    init() {
        super.init(frame: .zero)
        backgroundColor = .black
        autoresizingMask = [.flexibleWidth, .flexibleHeight]
        isUserInteractionEnabled = false
    }

    @available(*, unavailable)
    required init?(coder _: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
