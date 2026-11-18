import { NativeModule, requireNativeModule } from "expo";

declare class LibVlcPlayerModule extends NativeModule {
  /**
   * Checks whether the device supports Picture-in-Picture (PiP)
   *
   * @returns A `boolean` indicating Picture-in-Picture (PiP) support
   */
  isPictureInPictureSupported(): boolean;
  /**
   * Attempts to trigger the local network privacy alert
   *
   * @returns A promise which resolves to `void`
   *
   * @platform ios
   */
  triggerNetworkAlert(): Promise<void>;
}

export default requireNativeModule<LibVlcPlayerModule>("ExpoLibVlcPlayer");
