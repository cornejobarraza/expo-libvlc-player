import { NativeModule, requireNativeModule } from "expo";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
declare class LibVlcPlayerModule extends NativeModule<{}> {}

// This call loads the native module object from the JSI
export default requireNativeModule<LibVlcPlayerModule>("ExpoLibVlcPlayer");
