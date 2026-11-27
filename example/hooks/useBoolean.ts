import { useEffect, useState } from "react";

const DEFAULT_TIMEOUT = 5_000;

export function useBoolean(value: boolean) {
  const [bool, setBool] = useState<boolean>(value);

  useEffect(() => {
    if (!bool) return;
    const timeout = setTimeout(() => setBool(false), DEFAULT_TIMEOUT);
    return () => clearTimeout(timeout);
  }, [bool]);

  return [bool, setBool] as const;
}
