import { SymbolView } from "expo-symbols";

import { type IconProps } from "./types";

export const Icon = ({ style, name, size = 24, color }: IconProps) => {
  return <SymbolView style={style} name={name} size={size} tintColor={color} />;
};
