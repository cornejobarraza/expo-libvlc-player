import { type ConfigPlugin } from "expo/config-plugins";
type WithExpoLibVlcPlayerOptions = {
    supportsBackgroundPlayback?: boolean;
};
declare const withExpoLibVlcPlayer: ConfigPlugin<WithExpoLibVlcPlayerOptions>;
export default withExpoLibVlcPlayer;
