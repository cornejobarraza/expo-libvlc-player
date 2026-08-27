import { Text as RNText, type TextProps } from "react-native";
import Animated, { css, useReducedMotion } from "react-native-reanimated";

import { type TextLoadingProps, type TextComponent } from "./types";

const TextLoading = ({ width = "50%", height = 16 }: TextLoadingProps) => {
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View
      style={[
        styles.placeholder,
        { width, height, borderRadius: height / 4 },
        reducedMotion ? styles.static : styles.pulse,
      ]}
    />
  );
};

export const Text: TextComponent & { Loading: typeof TextLoading } = Object.assign(
  (props: TextProps) => <RNText {...props} />,
  {
    Loading: TextLoading,
  }
);

const pulse = css.keyframes({
  "0%": { opacity: 0.25 },
  "50%": { opacity: 0.6 },
  "100%": { opacity: 0.25 },
});

const styles = css.create({
  placeholder: {
    backgroundColor: "#f1f1f1",
  },
  static: {
    opacity: 0.4,
  },
  pulse: {
    animationName: pulse,
    animationDuration: "1200ms",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
});
