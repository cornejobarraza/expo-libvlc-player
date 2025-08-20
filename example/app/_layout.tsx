import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { FloatingPlayer } from "../components/FloatingPlayer";
import { FloatingProvider } from "../components/FloatingProvider";

export default function Layout() {
  return (
    <GestureHandlerRootView>
      <FloatingProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <FloatingPlayer />
      </FloatingProvider>
    </GestureHandlerRootView>
  );
}
