import {
  addOrientationChangeListener,
  getOrientationAsync,
  Orientation,
  unlockAsync,
  type OrientationChangeEvent,
} from "expo-screen-orientation";
import { useEffect, useState } from "react";

function getFullScreen(orientation: Orientation): boolean {
  return orientation === Orientation.LANDSCAPE_LEFT || orientation === Orientation.LANDSCAPE_RIGHT;
}

export function useFullScreen() {
  const [fullScreen, setFullScreen] = useState<boolean>(false);

  useEffect(() => {
    void unlockAsync();

    void getOrientation();

    const listener = ({ orientationInfo: { orientation } }: OrientationChangeEvent) => {
      const fullScreen = getFullScreen(orientation);
      setFullScreen(fullScreen);
    };

    const subscription = addOrientationChangeListener(listener);

    return () => {
      subscription.remove();
    };
  }, []);

  const getOrientation = async () => {
    const orientation = await getOrientationAsync();
    const fullScreen = getFullScreen(orientation);
    setFullScreen(fullScreen);
  };

  return fullScreen;
}
