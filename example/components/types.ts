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

export interface ControlProps {
  name: SFSymbol;
  onPress?: () => void;
}

export type MaterialIcon = ComponentProps<typeof MaterialIcons>["name"];

export type SymbolMapping = Record<SFSymbol, MaterialIcon>;

export interface IconProps {
  style?: StyleProp<TextStyle>;
  name: SFSymbol;
  size?: number;
  color: OpaqueColorValue | string;
}

export interface PlayerProps {
  source: LibVlcSource;
  fullScreen?: boolean;
}

export type LoadingProps = {
  width: DimensionValue;
  height: number;
};

export type TextComponent = (props: TextProps) => React.JSX.Element;
