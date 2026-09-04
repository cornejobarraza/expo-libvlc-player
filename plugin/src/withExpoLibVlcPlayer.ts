import {
  AndroidConfig,
  IOSConfig,
  withAndroidManifest,
  withInfoPlist,
  type ConfigPlugin,
} from "expo/config-plugins";

export interface WithExpoLibVlcPlayerProps {
  /**
   * A string to set the `NSLocalNetworkUsageDescription` permission message
   *
   * @default "Allow $(PRODUCT_NAME) to access your local network"
   *
   * @platform ios
   */
  localNetworkPermission?: string;
  /**
   * A boolean to enable Picture-in-Picture (PiP) support
   *
   * @default undefined
   */
  supportsPictureInPicture?: boolean;
}

const LOCAL_NETWORK_USAGE = "Allow $(PRODUCT_NAME) to access your local network";
const PIP_MANIFEST_ATTRIBUTE = "android:supportsPictureInPicture";
const AUDIO_BACKGROUND_MODE = "audio";

const withExpoLibVlcPlayer: ConfigPlugin<WithExpoLibVlcPlayerProps> = (
  config,
  { localNetworkPermission, supportsPictureInPicture } = {}
) => {
  withAndroidManifest(config, (config) => {
    const needsConfigMod = typeof supportsPictureInPicture === "boolean";

    if (needsConfigMod) {
      const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);

      if (supportsPictureInPicture) {
        activity.$[PIP_MANIFEST_ATTRIBUTE] = "true";
      } else {
        Reflect.deleteProperty(activity.$, PIP_MANIFEST_ATTRIBUTE);
      }
    }

    return config;
  });

  IOSConfig.Permissions.createPermissionsPlugin({
    NSLocalNetworkUsageDescription: LOCAL_NETWORK_USAGE,
  })(config, {
    NSLocalNetworkUsageDescription: localNetworkPermission,
  });

  withInfoPlist(config, (config) => {
    const needsConfigMod = typeof supportsPictureInPicture === "boolean";

    if (needsConfigMod) {
      const backgroundModes = config.modResults.UIBackgroundModes ?? [];
      const filteredModes = backgroundModes.filter((mode) => mode !== AUDIO_BACKGROUND_MODE);

      if (supportsPictureInPicture) {
        config.modResults.UIBackgroundModes = [...filteredModes, AUDIO_BACKGROUND_MODE];
      } else {
        config.modResults.UIBackgroundModes = filteredModes;
      }
    }

    return config;
  });

  return config;
};

export default withExpoLibVlcPlayer;
