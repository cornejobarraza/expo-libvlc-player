import { type ExpoConfig, type ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "LibVLC Player",
  slug: "expo-libvlc-player-example",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  android: {
    package: "expo.modules.libvlcplayer.example",
    adaptiveIcon: {
      backgroundColor: "#e6f4fe",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  ios: {
    bundleIdentifier: "expo.modules.libvlcplayer.example",
    supportsTablet: true,
  },
  plugins: ["expo-font"],
});
