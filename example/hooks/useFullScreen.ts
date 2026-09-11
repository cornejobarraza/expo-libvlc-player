import {
  addOrientationChangeListener,
  getOrientationAsync,
  Orientation,
  unlockAsync,
  type OrientationChangeEvent,
} from "expo-screen-orientation";
import { useEffect, useState } from "react";

export function useFullScreen() {
  const [fullScreen, setFullScreen] = useState<boolean>(false);

  const updateFullScreen = (orientation: Orientation) => {
    const isLandscapeLeft = orientation === Orientation.LANDSCAPE_LEFT;
    const isLandscapeRight = orientation === Orientation.LANDSCAPE_RIGHT;
    setFullScreen(isLandscapeLeft || isLandscapeRight);
  };

  const setOrientationAsync = async () => {
    try {
      const orientation = await getOrientationAsync();
      updateFullScreen(orientation);
    } catch {
      const orientation = Orientation.UNKNOWN;
      updateFullScreen(orientation);
    } finally {
      unlockAsync();
    }
  };

  const orientationListener = (event: OrientationChangeEvent) => {
    const orientation = event.orientationInfo.orientation;
    updateFullScreen(orientation);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrientationAsync();

    const subscription = addOrientationChangeListener(orientationListener);

    return () => {
      subscription.remove();
    };
  }, []);

  return fullScreen;
}
