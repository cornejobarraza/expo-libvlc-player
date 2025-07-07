"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const LOCAL_NETWORK_USAGE = "Allow $(PRODUCT_NAME) to access your local network";
const withExpoLibVlcPlayer = (config, { localNetworkPermission, supportsBackgroundPlayback } = {}) => {
    config_plugins_1.IOSConfig.Permissions.createPermissionsPlugin({
        NSLocalNetworkUsageDescription: LOCAL_NETWORK_USAGE,
    })(config, {
        NSLocalNetworkUsageDescription: localNetworkPermission,
    });
    (0, config_plugins_1.withInfoPlist)(config, (config) => {
        const currentBackgroundModes = config.modResults.UIBackgroundModes ?? [];
        const shouldEnableBackgroundAudio = supportsBackgroundPlayback;
        if (typeof supportsBackgroundPlayback === "undefined") {
            return config;
        }
        if (shouldEnableBackgroundAudio &&
            !currentBackgroundModes.includes("audio")) {
            config.modResults.UIBackgroundModes = [
                ...currentBackgroundModes,
                "audio",
            ];
        }
        else if (!shouldEnableBackgroundAudio) {
            config.modResults.UIBackgroundModes = currentBackgroundModes.filter((mode) => mode !== "audio");
        }
        return config;
    });
    return config;
};
exports.default = withExpoLibVlcPlayer;
