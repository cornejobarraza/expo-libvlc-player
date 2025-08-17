import { Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import PlayerView from "./PlayerView";

function clamp(val: number, min: number, max: number) {
  return Math.min(Math.max(val, min), max);
}

const { width, height } = Dimensions.get("screen");

const MIN_FINGER_DISTANCE = 1;
const MAX_TRANSLATE_X = width / 2 - 50;
const MAX_TRANSLATE_Y = height / 2 - 50;

const FloatingPlayer = () => {
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const prevTranslationX = useSharedValue(0);
  const prevTranslationY = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
    ],
  }));

  const pan = Gesture.Pan()
    .minDistance(MIN_FINGER_DISTANCE)
    .onStart(() => {
      prevTranslationX.value = translationX.value;
      prevTranslationY.value = translationY.value;
    })
    .onUpdate((event) => {
      translationX.value = clamp(
        prevTranslationX.value + event.translationX,
        -MAX_TRANSLATE_X,
        MAX_TRANSLATE_X,
      );
      translationY.value = clamp(
        prevTranslationY.value + event.translationY,
        -MAX_TRANSLATE_Y,
        MAX_TRANSLATE_Y,
      );
    })
    .runOnJS(true);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          animatedStyles,
          {
            ...StyleSheet.absoluteFillObject,
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "box-none",
          },
        ]}
      >
        <PlayerView />
      </Animated.View>
    </GestureDetector>
  );
};

export default FloatingPlayer;
