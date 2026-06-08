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
    unlockAsync();

    getOrientationAsync().then((orientation) => {
      setFullScreen(getFullScreen(orientation));
    });

    const subscription = addOrientationChangeListener(
      ({ orientationInfo: { orientation } }: OrientationChangeEvent) => {
        setFullScreen(getFullScreen(orientation));
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return fullScreen;
}
