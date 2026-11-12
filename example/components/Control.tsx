import { StyleSheet, TouchableOpacity } from "react-native";

import { Icon } from "./Icon";
import { Skeleton } from "./Skeleton";
import {
  CONTROL_BORDER_RADIUS,
  CONTROL_IDS,
  CONTROL_PADDING_HORIZONTAL,
  CONTROL_PADDING_VERTICAL,
  CONTROL_ICON_SIZE,
} from "./constants";
import { type ControlComponent, type ControlProps } from "./types";

const Loading = () => <Skeleton style={styles.loading} />;

export const Control: ControlComponent & { Loading: typeof Loading } = Object.assign(
  ({ name, translucent, onPress }: ControlProps) => (
    <TouchableOpacity
      style={[styles.control, translucent && styles.translucent]}
      onPress={onPress}
      testID={CONTROL_IDS[name]}>
      <Icon color="#f1f1f1" name={name} size={CONTROL_ICON_SIZE} />
    </TouchableOpacity>
  ),
  { Loading }
);

const styles = StyleSheet.create({
  control: {
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    paddingVertical: CONTROL_PADDING_VERTICAL,
    paddingHorizontal: CONTROL_PADDING_HORIZONTAL,
    borderRadius: CONTROL_BORDER_RADIUS,
  },
  translucent: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loading: {
    width: CONTROL_ICON_SIZE + CONTROL_PADDING_HORIZONTAL * 2,
    height: CONTROL_ICON_SIZE + CONTROL_PADDING_VERTICAL * 2,
    borderRadius: CONTROL_BORDER_RADIUS,
  },
});
