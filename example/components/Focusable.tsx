import { type SFSymbol } from "expo-symbols";
import { useRef } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

import { IconSymbol } from "./IconSymbol";

interface FocusableProps {
  name: SFSymbol;
  focused?: boolean;
  onFocus?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

const PRESS_DELAY = 125;

export function Focusable({ name, focused, onFocus, onPressIn, onPressOut }: FocusableProps) {
  const pressRef = useRef<number>(undefined);

  return (
    <Pressable
      style={[styles.pressable, focused ? styles.focused : styles.unfocused]}
      onFocus={() => onFocus?.()}
      onPressIn={() => {
        if (!Platform.isTV) onFocus?.();
        onPressIn?.();
      }}
      onPressOut={() => {
        onPressOut?.();
        clearTimeout(pressRef.current);
        pressRef.current = setTimeout(() => {
          if (Platform.isTV) onFocus?.();
        }, PRESS_DELAY);
      }}>
      <IconSymbol color={focused ? "#272727" : "#f1f1f1"} name={name} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  unfocused: {
    backgroundColor: "#272727",
  },
  focused: {
    backgroundColor: "#f1f1f1",
  },
});
