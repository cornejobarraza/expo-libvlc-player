import { StyleSheet, TouchableOpacity } from "react-native";

import { Icon } from "./Icon";
import { type IdMapping, type ControlProps } from "./types";

const IDS = {
  "play.fill": "play",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "forward.fill": "forward",
  "backward.fill": "backward",
  "speaker.1.fill": "speaker.1",
  "speaker.3.fill": "speaker.3",
} as IdMapping;

export const Control = ({ name, onPress }: ControlProps) => {
  return (
    <TouchableOpacity style={styles.control} onPress={onPress} testID={IDS[name]}>
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
