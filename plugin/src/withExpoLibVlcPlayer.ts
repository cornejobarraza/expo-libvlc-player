import {
  type ConfigPlugin,
  IOSConfig,
  withInfoPlist,
} from "expo/config-plugins";

const LOCAL_NETWORK_USAGE =
  "Allow $(PRODUCT_NAME) to access your local network";

type WithExpoLibVlcPlayerOptions = {
  localNetworkPermission?: string | false;
  supportsBackgroundPlayback?: boolean;
};

const withExpoLibVlcPlayer: ConfigPlugin<WithExpoLibVlcPlayerOptions> = (
  config,
  { localNetworkPermission, supportsBackgroundPlayback } = {},
) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSLocalNetworkUsageDescription: LOCAL_NETWORK_USAGE,
  })(config, {
    NSLocalNetworkUsageDescription: localNetworkPermission,
  });

  withInfoPlist(config, (config) => {
    const currentBackgroundModes = config.modResults.UIBackgroundModes ?? [];
    const shouldEnableBackgroundAudio = supportsBackgroundPlayback;

    if (typeof supportsBackgroundPlayback === "undefined") {
      return config;
    }

    if (
      shouldEnableBackgroundAudio &&
      !currentBackgroundModes.includes("audio")
    ) {
      config.modResults.UIBackgroundModes = [
        ...currentBackgroundModes,
        "audio",
      ];
    } else if (!shouldEnableBackgroundAudio) {
      config.modResults.UIBackgroundModes = currentBackgroundModes.filter(
        (mode: string) => mode !== "audio",
      );
    }

    return config;
  });

  return config;
};

export default withExpoLibVlcPlayer;
