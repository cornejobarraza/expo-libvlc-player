import { SymbolView } from "expo-symbols";

import { IconSymbolIosProps } from "./types";

export function IconSymbol({ style, name, size = 24, color }: IconSymbolIosProps) {
  return (
    <SymbolView
      style={[{ width: size, height: size }, style]}
      name={name}
      tintColor={color}
      weight="regular"
    />
  );
}
