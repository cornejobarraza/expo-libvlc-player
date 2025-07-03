import { type ConfigPlugin, withInfoPlist } from "expo/config-plugins";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const withExpoLibVlcPlayer: ConfigPlugin<{}> = (config) => {
  withInfoPlist(config, (config) => {
    const currentBackgroundModes = config.modResults.UIBackgroundModes ?? [];

    if (!currentBackgroundModes.includes("audio")) {
      config.modResults.UIBackgroundModes = [
        ...currentBackgroundModes,
        "audio",
      ];
    }

    return config;
  });

  return config;
};

export default withExpoLibVlcPlayer;
