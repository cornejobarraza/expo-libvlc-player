import { useEffect, useRef } from "react";

export function useTimeoutRef() {
  const timeoutRef = useRef<number>(null);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return timeoutRef;
}
