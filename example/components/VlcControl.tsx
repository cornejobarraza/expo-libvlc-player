import { StyleSheet, TouchableOpacity } from "react-native";

import { IconSymbol } from "./IconSymbol";
import { type VlcControlProps } from "./types";

const COLOR_BACKGROUND = "#272727";
const COLOR_ICON = "#f1f1f1";

export function VlcControl({ name, onPress }: VlcControlProps) {
  return (
    <TouchableOpacity style={styles.control} onPress={onPress}>
      <IconSymbol color={COLOR_ICON} name={name} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  control: {
    backgroundColor: COLOR_BACKGROUND,
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});
