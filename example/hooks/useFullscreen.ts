import {
  addOrientationChangeListener,
  getOrientationAsync,
  Orientation,
  type OrientationChangeEvent,
} from "expo-screen-orientation";
import { useEffect, useState } from "react";

export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState<boolean>(false);

  const update = (orientation: Orientation) => {
    const isLandscapeLeft = orientation === Orientation.LANDSCAPE_LEFT;
    const isLandscapeRight = orientation === Orientation.LANDSCAPE_RIGHT;
    setFullscreen(isLandscapeLeft || isLandscapeRight);
  };

  const sync = async () => {
    try {
      const orientation = await getOrientationAsync();
      update(orientation);
    } catch {
      const orientation = Orientation.UNKNOWN;
      update(orientation);
    }
  };

  const listener = (event: OrientationChangeEvent) => {
    const orientation = event.orientationInfo.orientation;
    update(orientation);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    sync();

    const subscription = addOrientationChangeListener(listener);

    return () => {
      subscription.remove();
    };
  }, []);

  return fullscreen;
}
