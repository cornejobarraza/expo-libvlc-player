"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withExpoLibVlcPlayer = (config, { supportsBackgroundPlayback }) => {
    (0, config_plugins_1.withInfoPlist)(config, (config) => {
        const currentBackgroundModes = config.modResults.UIBackgroundModes ?? [];
        const shouldEnableBackgroundAudio = supportsBackgroundPlayback;
        if (typeof supportsBackgroundPlayback === 'undefined') {
            return config;
        }
        if (shouldEnableBackgroundAudio && !currentBackgroundModes.includes('audio')) {
            config.modResults.UIBackgroundModes = [...currentBackgroundModes, 'audio'];
        }
        else if (!shouldEnableBackgroundAudio) {
            config.modResults.UIBackgroundModes = currentBackgroundModes.filter((mode) => mode !== 'audio');
        }
        return config;
    });
    return config;
};
exports.default = withExpoLibVlcPlayer;
