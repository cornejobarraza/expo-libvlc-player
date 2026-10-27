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
  /**
   * A boolean to enable background playback support for `nowPlaying`
   *
   * @default undefined
   */
  supportsBackgroundPlayback?: boolean;
}

const LOCAL_NETWORK_USAGE = "Allow $(PRODUCT_NAME) to access your local network";
const PIP_MANIFEST_ATTRIBUTE = "android:supportsPictureInPicture";
const AUDIO_BACKGROUND_MODE = "audio";
const SERVICE_NAME = "expo.modules.libvlcplayer.managers.NowPlayingService";
const SERVICE_PERMISSIONS = [
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
];

const withExpoLibVlcPlayer: ConfigPlugin<WithExpoLibVlcPlayerProps> = (
  config,
  { localNetworkPermission, supportsPictureInPicture, supportsBackgroundPlayback } = {}
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

    const needsServiceMod = typeof supportsBackgroundPlayback === "boolean";

    if (needsServiceMod) {
      const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

      application.service = (application.service ?? []).filter(
        (service) => service.$["android:name"] !== SERVICE_NAME
      );

      // Permissions are kept when disabled, other modules may need them
      if (supportsBackgroundPlayback) {
        AndroidConfig.Permissions.ensurePermissions(config.modResults, SERVICE_PERMISSIONS);
        application.service.push({
          $: {
            "android:name": SERVICE_NAME,
            "android:exported": "false",
            "android:foregroundServiceType": "mediaPlayback",
          },
        });
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
    const needsConfigMod =
      typeof supportsPictureInPicture === "boolean" ||
      typeof supportsBackgroundPlayback === "boolean";

    if (needsConfigMod) {
      const backgroundModes = config.modResults.UIBackgroundModes ?? [];
      const filteredModes = backgroundModes.filter((mode) => mode !== AUDIO_BACKGROUND_MODE);

      if (supportsPictureInPicture || supportsBackgroundPlayback) {
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
