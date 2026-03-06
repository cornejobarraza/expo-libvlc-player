import { LibVlcPlayerView } from "expo-libvlc-player";

const BIG_BUCK_BUNNY =
  "https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov";

export default function App() {
  return <LibVlcPlayerView source={BIG_BUCK_BUNNY} />;
}
