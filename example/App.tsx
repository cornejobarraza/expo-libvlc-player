import { NavigationBar } from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { VlcPlayer } from "./components/VlcPlayer";
import { useFullScreen } from "./hooks/useFullScreen";

const BIG_BUCK_BUNNY =
  "https://mirror.umd.edu/xbmc/demo-files/BBB/bbb_sunflower_1080p_30fps_normal.mp4";

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
        {!fullScreen && <Text style={styles.title}>Big Buck Bunny</Text>}
        <VlcPlayer source={BIG_BUCK_BUNNY} fullScreen={fullScreen} />
        <NavigationBar style="light" hidden={fullScreen} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    justifyContent: "center",
    gap: 20,
    padding: 24,
  },
  title: {
    color: "#f1f1f1",
    fontSize: 20,
    fontWeight: "bold",
  },
});
