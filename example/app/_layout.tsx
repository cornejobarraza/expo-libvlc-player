import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import FloatingPlayer from "../components/FloatingPlayer";
import { PlayerProvider } from "../components/PlayerProvider";

export default function Layout() {
  return (
    <GestureHandlerRootView>
      <PlayerProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <FloatingPlayer />
      </PlayerProvider>
    </GestureHandlerRootView>
  );
}
