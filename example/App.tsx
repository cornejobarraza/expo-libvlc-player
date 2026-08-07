import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LibVlcPlayer } from "./components/LibVlcPlayer";
import { useFullScreen } from "./hooks/useFullScreen";

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
          source="https://mirror.umd.edu/xbmc/demo-files/BBB/bbb_sunflower_1080p_30fps_normal.mp4"
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
