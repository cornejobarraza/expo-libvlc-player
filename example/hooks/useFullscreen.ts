import {
  addOrientationChangeListener,
  getOrientationAsync,
  Orientation,
  unlockAsync,
  type OrientationChangeEvent,
} from "expo-screen-orientation";
import { useEffect, useState } from "react";

export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState<boolean>(false);

  const updateFullscreen = (orientation: Orientation) => {
    const isLandscapeLeft = orientation === Orientation.LANDSCAPE_LEFT;
    const isLandscapeRight = orientation === Orientation.LANDSCAPE_RIGHT;
    setFullscreen(isLandscapeLeft || isLandscapeRight);
  };

  const setOrientationAsync = async () => {
    try {
      const orientation = await getOrientationAsync();
      updateFullscreen(orientation);
    } catch {
      const orientation = Orientation.UNKNOWN;
      updateFullscreen(orientation);
    } finally {
      unlockAsync();
    }
  };

  const orientationListener = (event: OrientationChangeEvent) => {
    const orientation = event.orientationInfo.orientation;
    updateFullscreen(orientation);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrientationAsync();

    const subscription = addOrientationChangeListener(orientationListener);

    return () => {
      subscription.remove();
    };
  }, []);

  return fullscreen;
}
