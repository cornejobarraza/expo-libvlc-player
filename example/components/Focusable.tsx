import { useRef } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

import { IconSymbol } from "./IconSymbol";
import { type FocusableProps, type TimeoutRef } from "./types";

const COLOR_FOCUSED = "#f1f1f1";
const COLOR_UNFOCUSED = "#272727";
const PRESS_DELAY = 125;

export function Focusable({ name, focused, onFocus, onPressIn, onPressOut }: FocusableProps) {
  const pressRef = useRef<TimeoutRef>(undefined);

  return (
    <Pressable
      style={[styles.pressable, { backgroundColor: focused ? COLOR_FOCUSED : COLOR_UNFOCUSED }]}
      onFocus={() => {
        onFocus?.();
      }}
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
      <IconSymbol color={!focused ? COLOR_FOCUSED : COLOR_UNFOCUSED} name={name} />
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
});
