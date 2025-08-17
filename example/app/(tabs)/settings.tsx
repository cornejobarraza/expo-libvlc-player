import { Text, StyleSheet, SafeAreaView } from "react-native";

export default function SettingsTab() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Media should keep playing on this tab</Text>
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
