import { StyleSheet, TouchableOpacity } from "react-native";

import { Icon } from "./Icon";
import { type ControlProps } from "./types";

export const Control = ({ name, onPress }: ControlProps) => {
  return (
    <TouchableOpacity style={styles.control} onPress={onPress} testID={name}>
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
});
