import { StyleSheet, TouchableOpacity } from "react-native";

import { MaterialSymbol } from "./MaterialSymbol";
import { type VlcControlProps } from "./types";

export const VlcControl = ({ name, onPress }: VlcControlProps) => {
  return (
    <TouchableOpacity style={styles.control} onPress={onPress}>
      <MaterialSymbol color="#f1f1f1" name={name} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  control: {
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});
