import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import { LibVlcPlayer } from "./components/LibVlcPlayer";

export default function App() {
  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <LibVlcPlayer
        title="Big Buck Bunny"
        source="https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    justifyContent: "center",
    gap: 24,
    padding: 24,
  },
});
