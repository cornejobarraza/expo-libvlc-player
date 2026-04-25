import { NativeModule, requireNativeModule } from "expo";

import { type LibVlcPlayerModuleEvents } from "./LibVlcPlayer.types";

declare class LibVlcPlayerModule extends NativeModule<LibVlcPlayerModuleEvents> {
  /** Attempts to trigger the local network privacy alert
   *
   * @returns A promise which resolves to `void`
   *
   * @platform ios
   */
  triggerNetworkAlert(): Promise<void>;
  /**
   * Checks whether the device supports Picture-in-Picture (PiP)
   *
   * @returns A `boolean` indicating Picture-in-Picture (PiP) support
   */
  isPictureInPictureSupported(): boolean;
}

export default requireNativeModule<LibVlcPlayerModule>("ExpoLibVlcPlayer");
