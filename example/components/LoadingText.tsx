import Animated, { css, useReducedMotion } from "react-native-reanimated";

import { type LoadingTextProps } from "./types";

export const LoadingText = ({ width = "50%", height = 16 }: LoadingTextProps) => {
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
