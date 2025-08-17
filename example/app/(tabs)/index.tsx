import { Text, StyleSheet, Button, SafeAreaView } from "react-native";

import { usePlayer } from "../../components/PlayerProvider";

export default function HomeTab() {
  const { show, toggle } = usePlayer();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={{ marginBottom: 24 }}>
        Media player can be toggled from this tab
      </Text>
      <Button title={`${!show ? "Show" : "Hide"} Player`} onPress={toggle} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
