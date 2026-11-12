import Animated, { css } from "react-native-reanimated";

import { type SkeletonProps } from "./types";

export const Skeleton = ({ style }: SkeletonProps) => (
  <Animated.View style={[styles.skeleton, style, styles.animation]} />
);

const pulse = css.keyframes({
  "0%": { opacity: 0.3 },
  "50%": { opacity: 0.6 },
  "100%": { opacity: 0.3 },
});

const styles = css.create({
  skeleton: {
    backgroundColor: "#f1f1f1",
  },
  animation: {
    animationName: pulse,
    animationDuration: "1600ms",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
});
