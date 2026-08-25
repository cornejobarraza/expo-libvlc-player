import { SymbolView } from "expo-symbols";

import { type IconSymbolProps } from "./types";

export function MaterialSymbol({ style, name, size = 24, color }: IconSymbolProps) {
  return <SymbolView style={style} name={name} size={size} tintColor={color} />;
}
