const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  ...Array.from(config.resolver.blockList),
  new RegExp(path.resolve("..", "node_modules", "react")),
  new RegExp(path.resolve("..", "node_modules", "react-native")),
];

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "./node_modules"),
  path.resolve(__dirname, "../node_modules"),
];

config.resolver.extraNodeModules = {
  "expo-libvlc-player": "..",
};

if (process.env.EXPO_TV) {
  config.resolver.sourceExts = [].concat(
    config.resolver.sourceExts.map((e) => `tv.${e}`),
    config.resolver.sourceExts
  );
}

config.watchFolders = [path.resolve(__dirname, "..")];

config.transformer.getTransformOptions = () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
