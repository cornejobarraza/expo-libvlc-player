import { NativeModule, requireNativeModule } from "expo";

import { LibVlcPlayerModuleEvents } from "./LibVlcPlayer.types";

declare class LibVlcPlayerModule extends NativeModule<LibVlcPlayerModuleEvents> {
  /** Attempts to trigger the local network privacy alert
   *
   * @returns A promise which resolves to `void`
   *
   * @platform ios
   */
  triggerAlert(): Promise<void>;
}

export default requireNativeModule<LibVlcPlayerModule>("ExpoLibVlcPlayer");
