import { useEffect, useRef } from "react";

export function useTimeoutRef() {
  const timeoutRef = useRef<number>(null);

  const setTimeoutRef = (handler: () => void, timeout: number) => {
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
