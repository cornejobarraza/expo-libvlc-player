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
   * A boolean to enable background playback support
   *
   * @default undefined
   */
  supportsBackgroundPlayback?: boolean;
  /**
   * A boolean to enable Picture-in-Picture (PiP) support
   *
   * @default undefined
   */
  supportsPictureInPicture?: boolean;
}

const LOCAL_NETWORK_USAGE = "Allow $(PRODUCT_NAME) to access your local network";
const PLAYBACK_SERVICE_NAME = "expo.modules.libvlcplayer.utils.MediaPlaybackService";
const PLAYBACK_SERVICE_PERMISSIONS = [
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
];
const AUDIO_BACKGROUND_MODE = "audio";
const PIP_MANIFEST_ATTRIBUTE = "android:supportsPictureInPicture";

const withExpoLibVlcPlayer: ConfigPlugin<WithExpoLibVlcPlayerProps> = (
  config,
  { localNetworkPermission, supportsBackgroundPlayback, supportsPictureInPicture } = {}
) => {
  withAndroidManifest(config, (config) => {
    if (typeof supportsBackgroundPlayback === "boolean") {
      const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
      const services = (application.service ?? []).filter(
        (service) => service.$["android:name"] !== PLAYBACK_SERVICE_NAME
      );

      if (supportsBackgroundPlayback) {
        AndroidConfig.Permissions.ensurePermissions(
          config.modResults,
          PLAYBACK_SERVICE_PERMISSIONS
        );

        application.service = [
          ...services,
          {
            $: {
              "android:name": PLAYBACK_SERVICE_NAME,
              "android:exported": "false",
              "android:foregroundServiceType": "mediaPlayback",
            },
          },
        ];
      } else {
        application.service = services;
      }
    }

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
    const needsConfigMod =
      typeof supportsBackgroundPlayback === "boolean" ||
      typeof supportsPictureInPicture === "boolean";

    if (needsConfigMod) {
      const backgroundModes = config.modResults.UIBackgroundModes ?? [];
      const filteredModes = backgroundModes.filter((mode) => mode !== AUDIO_BACKGROUND_MODE);

      if (supportsBackgroundPlayback || supportsPictureInPicture) {
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
