import { StyleSheet, TouchableOpacity } from "react-native";

import { Icon } from "./Icon";
import { CONTROL_IDS } from "./constants";
import { type ControlProps } from "./types";

export const Control = ({ name, translucent, onPress }: ControlProps) => {
  return (
    <TouchableOpacity style={[styles.control, translucent && styles.translucent]} onPress={onPress} testID={CONTROL_IDS[name]}>
      <Icon color="#f1f1f1" name={name} />
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
  translucent: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
