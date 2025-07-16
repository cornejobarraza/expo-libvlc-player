import { NativeModule, requireNativeModule } from "expo";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare class LibVlcPlayerModule extends NativeModule<{}> {}

export default requireNativeModule<LibVlcPlayerModule>("ExpoLibVlcPlayer");
