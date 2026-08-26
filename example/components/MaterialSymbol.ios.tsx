import { SymbolView } from "expo-symbols";

import { type MaterialSymbolProps } from "./types";

export const MaterialSymbol = ({ style, name, size = 24, color }: MaterialSymbolProps) => {
  return <SymbolView style={style} name={name} size={size} tintColor={color} />;
};
