import { NavigationBar } from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { VlcPlayer } from "./components/VlcPlayer";
import { useFullScreen } from "./hooks/useFullScreen";

export default function App() {
  const fullScreen = useFullScreen();

  const padding = !fullScreen ? styles.app.padding : undefined;

  return (
    <SafeAreaProvider>
      <View style={{ ...styles.app, padding }}>
        <StatusBar style="light" hidden={fullScreen} />
        <VlcPlayer source={require("./assets/bbb.mp4")} fullScreen={fullScreen} />
        <NavigationBar style="light" hidden={fullScreen} />
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
