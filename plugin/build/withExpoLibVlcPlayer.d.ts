import { type ConfigPlugin } from "expo/config-plugins";
type WithExpoLibVlcPlayerOptions = {
    localNetworkPermission?: string | false;
    supportsBackgroundPlayback?: boolean;
};
declare const withExpoLibVlcPlayer: ConfigPlugin<WithExpoLibVlcPlayerOptions>;
export default withExpoLibVlcPlayer;
