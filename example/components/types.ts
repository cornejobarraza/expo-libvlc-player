import { type MaterialIcons } from "@expo/vector-icons";
import { type LibVlcSource } from "expo-libvlc-player";
import { type SFSymbol } from "expo-symbols";
import { type ComponentProps } from "react";
import {
  type DimensionValue,
  type TextProps,
  type OpaqueColorValue,
  type StyleProp,
  type TextStyle,
} from "react-native";

export type MaterialIcon = ComponentProps<typeof MaterialIcons>["name"];

export type SymbolMapping = Record<SFSymbol, MaterialIcon>;

export interface MaterialSymbolProps {
  style?: StyleProp<TextStyle>;
  name: SFSymbol;
  size?: number;
  color: string | OpaqueColorValue;
}

export type TextComponent = (props: TextProps) => React.JSX.Element;

export type TextLoadingProps = {
  width?: DimensionValue;
  height?: number;
};

export interface VlcControlProps {
  name: SFSymbol;
  onPress?: () => void;
}

export interface VlcPlayerProps {
  source: LibVlcSource;
  fullScreen?: boolean;
}
