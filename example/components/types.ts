import type MaterialIcons from "@react-native-vector-icons/material-icons";
import { type LibVlcSource } from "expo-libvlc-player";
import { type SFSymbol } from "expo-symbols";
import { type JSX, type ComponentProps } from "react";
import {
  type DimensionValue,
  type TextProps,
  type StyleProp,
  type TextStyle,
  type NativeColorValue,
} from "react-native";

export interface ControlProps {
  name: SFSymbol;
  translucent?: boolean;
  onPress?: () => void;
}

export type IdMapping = Record<SFSymbol, string>;

export type MaterialIcon = ComponentProps<typeof MaterialIcons>["name"];

export type SymbolMapping = Record<SFSymbol, MaterialIcon>;

export interface IconProps {
  style?: StyleProp<TextStyle>;
  name: SFSymbol;
  size?: number;
  color: NativeColorValue | string;
}

export interface PlayerProps {
  source: LibVlcSource;
  fullScreen?: boolean;
}

export type LoadingProps = {
  width: DimensionValue;
  height: number;
};

export type TextComponent = (props: TextProps) => JSX.Element;
