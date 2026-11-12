import { useEffect, useRef, useState } from "react";

const DEFAULT_TIMEOUT = 5_000;

export function useTimedBoolean(value: boolean) {
  const [bool, setBool] = useState<boolean>(value);
  const timeoutRef = useRef<number>(null);

  const set = (bool: boolean) => {
    setBool(bool);
  };

  const clear = () => {
    clearTimeout(timeoutRef.current);
  };

  const schedule = () => {
    const timeout = setTimeout(() => set(false), DEFAULT_TIMEOUT);
    timeoutRef.current = timeout;
  };

  const update = (next: boolean) => {
    clear();
    set(next);
    schedule();
  };

  useEffect(() => {
    schedule();
    return clear;
  }, [bool]);

  return [bool, update] as const;
}
