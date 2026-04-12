import {
  AndroidConfig,
  IOSConfig,
  withAndroidManifest,
  withInfoPlist,
  type ConfigPlugin,
} from "expo/config-plugins";

const LOCAL_NETWORK_USAGE = "Allow $(PRODUCT_NAME) to access your local network";

type WithExpoLibVlcPlayerOptions = {
  localNetworkPermission?: string;
  supportsPictureInPicture?: boolean;
};

const withExpoLibVlcPlayer: ConfigPlugin<WithExpoLibVlcPlayerOptions> = (
  config,
  { localNetworkPermission, supportsPictureInPicture } = {}
) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSLocalNetworkUsageDescription: LOCAL_NETWORK_USAGE,
  })(config, {
    NSLocalNetworkUsageDescription: localNetworkPermission,
  });

  withInfoPlist(config, (config) => {
    const needsConfigMod = typeof supportsPictureInPicture === "boolean";

    if (needsConfigMod) {
      const backgroundModes = config.modResults.UIBackgroundModes ?? [];
      const filteredModes = backgroundModes.filter((mode) => mode !== "audio");

      if (supportsPictureInPicture) {
        config.modResults.UIBackgroundModes = [...filteredModes, "audio"];
      } else {
        config.modResults.UIBackgroundModes = filteredModes;
      }
    }

    return config;
  });

  withAndroidManifest(config, (config) => {
    const needsConfigMod = typeof supportsPictureInPicture === "boolean";

    if (needsConfigMod) {
      const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);

      if (supportsPictureInPicture) {
        activity.$["android:supportsPictureInPicture"] = "true";
      } else {
        delete activity.$["android:supportsPictureInPicture"];
      }
    }

    return config;
  });

  return config;
};

export default withExpoLibVlcPlayer;
