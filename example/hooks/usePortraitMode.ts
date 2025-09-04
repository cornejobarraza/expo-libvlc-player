import {
  addOrientationChangeListener,
  getOrientationAsync,
  Orientation,
  OrientationChangeEvent,
  unlockAsync,
} from "expo-screen-orientation";
import { useEffect, useState } from "react";

export function usePortraitMode() {
  const [orientation, setOrientation] = useState<Orientation>(
    Orientation.UNKNOWN,
  );

  const setupOrientation = async () => {
    const orientation = await getOrientationAsync();
    setOrientation(orientation);
    await unlockAsync();
  };

  useEffect(() => {
    setupOrientation();

    const listener = ({
      orientationInfo: { orientation },
    }: OrientationChangeEvent) => setOrientation(orientation);
    const subscription = addOrientationChangeListener(listener);

    return () => {
      subscription.remove();
    };
  }, []);

  const portrait =
    orientation !== Orientation.LANDSCAPE_LEFT &&
    orientation !== Orientation.LANDSCAPE_RIGHT;

  return portrait;
}
