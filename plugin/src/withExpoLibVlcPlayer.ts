import { type ConfigPlugin, withInfoPlist } from "expo/config-plugins";

type WithExpoLibVlcPlayerOptions = {
  supportsBackgroundPlayback?: boolean;
};

const withExpoLibVlcPlayer: ConfigPlugin<WithExpoLibVlcPlayerOptions> = (
  config,
  { supportsBackgroundPlayback },
) => {
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
