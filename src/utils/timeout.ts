import { useEffect, useRef } from "react";

const DEFAULT_TIMEOUT = 300;

export function useTimeoutRef() {
  const timeoutRef = useRef<number>(null);

  const setTimeoutRef = (handler: () => void, timeout: number = DEFAULT_TIMEOUT) => {
    clearTimeoutRef();
    const ref = setTimeout(handler, timeout);
    timeoutRef.current = ref;
  };

  const clearTimeoutRef = () => {
    clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    return () => {
      clearTimeoutRef();
    };
  }, []);

  return setTimeoutRef;
}
