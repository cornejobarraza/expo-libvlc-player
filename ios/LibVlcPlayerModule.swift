import ExpoModulesCore

public class LibVlcPlayerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoLibVlcPlayer")

        View(LibVlcPlayerView.self) {
            Prop("source") { (view: LibVlcPlayerView, source: String) in
                if source != view.source {
                    view.source = source
                }
            }

            Prop("options", .init()) { (view: LibVlcPlayerView, options: [String]) in
                if options != view.options {
                    view.options = options
                }
            }

            OnViewDidUpdateProps { (view: LibVlcPlayerView) in
                view.setupPlayer()
            }
        }
    }
}
