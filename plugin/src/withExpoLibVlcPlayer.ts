import { IOSConfig, type ConfigPlugin } from "expo/config-plugins";

const LOCAL_NETWORK_USAGE =
  "Allow $(PRODUCT_NAME) to access your local network";

type WithExpoLibVlcPlayerOptions = {
  localNetworkPermission?: string;
};

const withExpoLibVlcPlayer: ConfigPlugin<WithExpoLibVlcPlayerOptions> = (
  config,
  { localNetworkPermission } = {},
) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSLocalNetworkUsageDescription: LOCAL_NETWORK_USAGE,
  })(config, {
    NSLocalNetworkUsageDescription: localNetworkPermission,
  });

  return config;
};

export default withExpoLibVlcPlayer;
