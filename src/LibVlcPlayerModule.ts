import { NativeModule, requireNativeModule } from "expo";

import { LibVlcPlayerModuleEvents } from "./LibVlcPlayer.types";

declare class LibVlcPlayerModule extends NativeModule<LibVlcPlayerModuleEvents> {
  /** Attempts to check whether battery optimization is enabled
   *
   * @returns A promise which resolves to `true` or `false`
   *
   * @platform android
   */
  checkBatteryOptimization(): Promise<boolean>;
  /** Attempts to trigger the local network privacy alert
   *
   * @returns A promise which resolves to `void`
   *
   * @platform ios
   */
  triggerNetworkAlert(): Promise<void>;
}

export default requireNativeModule<LibVlcPlayerModule>("ExpoLibVlcPlayer");
