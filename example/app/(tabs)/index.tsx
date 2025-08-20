import { useState } from "react";
import { Text, StyleSheet, Button, SafeAreaView, View } from "react-native";

import { useFloating } from "../../components/FloatingProvider";
import { PlayerView } from "../../components/PlayerView";

export default function HomeTab() {
  const [show, setShow] = useState<boolean>(false);

  const { open, toggle } = useFloating();

  return (
    <SafeAreaView style={styles.container}>
      <Text>Player can be toggled from this tab</Text>
      {show && !open && <PlayerView floating={false} />}
      <View style={styles.buttons}>
        {!show && (
          <Button
            title={`${!open ? "Open" : "Close"} Floating`}
            onPress={toggle}
          />
        )}
        {!open && (
          <Button
            title={`${!show ? "Show" : "Hide"} Embedded`}
            onPress={() => setShow((prev) => !prev)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  buttons: {
    flexDirection: "row",
    gap: 16,
  },
});
