import { useState } from "react";
import {
  Text,
  StyleSheet,
  Button,
  SafeAreaView,
  View,
  ScrollView,
} from "react-native";

import { useFloating } from "../../components/FloatingProvider";
import { PlayerView } from "../../components/PlayerView";

export default function HomeTab() {
  const [showEmbedded, setShowEmbedded] = useState<boolean>(false);

  const { showFloating, toggleFloating } = useFloating();

  const toggleEmbedded = () => setShowEmbedded((prev) => !prev);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text>Player can be toggled from this tab</Text>
        {showEmbedded && !showFloating && <PlayerView />}
        <View style={styles.buttons}>
          {!showEmbedded && (
            <Button
              title={`${!showFloating ? "Open" : "Close"} Floating`}
              onPress={toggleFloating}
            />
          )}
          {!showFloating && (
            <Button
              title={`${!showEmbedded ? "Show" : "Hide"} Embedded`}
              onPress={toggleEmbedded}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 24,
  },
  buttons: {
    flexDirection: "row",
    gap: 16,
  },
});
