import { Text as RNText, type TextProps } from "react-native";
import Animated, { css, useReducedMotion } from "react-native-reanimated";

import { type LoadingProps, type TextComponent } from "./types";

const Loading = ({ width, height }: LoadingProps) => {
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View
      style={[
        styles.loading,
        { width, height, borderRadius: height / 4 },
        reducedMotion ? styles.static : styles.animation,
      ]}
    />
  );
};

export const Text: TextComponent & { Loading: typeof Loading } = Object.assign(
  (props: TextProps) => <RNText {...props} />,
  { Loading }
);

const pulse = css.keyframes({
  "0%": { opacity: 0.3 },
  "50%": { opacity: 0.6 },
  "100%": { opacity: 0.3 },
});

const styles = css.create({
  loading: {
    backgroundColor: "#f1f1f1",
  },
  static: {
    opacity: 0.4,
  },
  animation: {
    animationName: pulse,
    animationDuration: "1200ms",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
});
