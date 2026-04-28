import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import { LibVlcPlayer } from "./components/LibVlcPlayer";
import { useFullScreen } from "./hooks/useFullScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  const fullScreen = useFullScreen();

  return (
    <SafeAreaProvider>
      <View
        style={{
          ...styles.app,
          backgroundColor: !fullScreen ? styles.app.backgroundColor : "black",
          padding: !fullScreen ? styles.app.padding : undefined,
        }}>
        <StatusBar style="light" hidden={fullScreen} />
        <LibVlcPlayer
          title="Big Buck Bunny"
          source="https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov"
          fullScreen={fullScreen}
        />
      </View>
    </SafeAreaProvider>
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
