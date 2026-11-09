import { NavigationBar } from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Player } from "./components/Player";
import { useFullscreen } from "./hooks/useFullscreen";

const BBB_CLIP = require("./assets/bbb.mp4");
const BBB_POSTER = require("./assets/bbb.png");

export default function App() {
  const fullscreen = useFullscreen();
  const padding = !fullscreen ? styles.app.padding : undefined;

  return (
    <SafeAreaProvider>
      <View style={{ ...styles.app, padding }}>
        <StatusBar style="light" hidden={fullscreen} />
        <Player source={BBB_CLIP} poster={BBB_POSTER} fullscreen={fullscreen} />
        <NavigationBar style="light" hidden={fullscreen} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    padding: 24,
  },
});
