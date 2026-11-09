import { useEffect, useRef, useState } from "react";

const HIDE_DELAY = 3000;

export function useControls(fullscreen?: boolean) {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const timeoutRef = useRef<number>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const show = () => {
    if (fullscreen) {
      clearTimeout(timeoutRef.current);
      setIsVisible(true);
      timeoutRef.current = setTimeout(hide, HIDE_DELAY);
    }
  };

  const toggle = () => {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  };

  const visible = !fullscreen || isVisible;

  return { visible, show, toggle };
}
