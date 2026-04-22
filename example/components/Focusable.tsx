import { SFSymbol } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

import { IconSymbol } from "./IconSymbol";

interface FocusableProps {
  name: SFSymbol;
  focused?: boolean;
  onFocus?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export function Focusable({ name, focused, onFocus, onPressIn, onPressOut }: FocusableProps) {
  return (
    <Pressable
      style={focused ? styles.focused : styles.unfocused}
      onFocus={() => onFocus?.()}
      onPressIn={() => {
        onFocus?.();
        onPressIn?.();
      }}
      onPressOut={() => onPressOut?.()}>
      <IconSymbol color={focused ? "#272727" : "#f1f1f1"} name={name} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  unfocused: {
    backgroundColor: "#272727",
    maxHeight: 32,
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  focused: {
    backgroundColor: "#f1f1f1",
    borderColor: "#272727",
    maxHeight: 32,
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});
