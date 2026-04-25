import { type SFSymbol, SymbolView } from "expo-symbols";
import { type StyleProp, type ViewStyle } from "react-native";

interface IconSymbolProps {
  style?: StyleProp<ViewStyle>;
  name: SFSymbol;
  size?: number;
  color: string;
}

export function IconSymbol({ style, name, size = 24, color }: IconSymbolProps) {
  return (
    <SymbolView
      style={[{ width: size, height: size }, style]}
      name={name}
      tintColor={color}
      weight="regular"
    />
  );
}
