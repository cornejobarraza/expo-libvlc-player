import { StyleSheet, TouchableOpacity } from "react-native";

import { IconSymbol } from "./IconSymbol";
import { type VlcControlProps } from "./types";

const BACKGROUND_COLOR = "#272727";
const ICON_COLOR = "#f1f1f1";

export function VlcControl({ name, onPress }: VlcControlProps) {
  return (
    <TouchableOpacity style={styles.control} onPress={onPress}>
      <IconSymbol color={ICON_COLOR} name={name} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  control: {
    backgroundColor: BACKGROUND_COLOR,
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});
