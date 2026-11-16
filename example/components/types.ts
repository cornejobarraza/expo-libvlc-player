import type MaterialIcons from "@react-native-vector-icons/material-icons";
import { type Source } from "expo-libvlc-player";
import { type SFSymbol } from "expo-symbols";
import { type JSX, type ComponentProps } from "react";
import {
  type ImageProps,
  type TextProps,
  type StyleProp,
  type TextStyle,
  type NativeColorValue,
  type ViewStyle,
} from "react-native";

export type MaterialIcon = ComponentProps<typeof MaterialIcons>["name"];

export type SymbolMapping = Record<SFSymbol, MaterialIcon>;

export interface IconProps {
  style?: StyleProp<TextStyle>;
  name: SFSymbol;
  size?: number;
  color: NativeColorValue | string;
}

export interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
}

export interface LoadingProps {
  style?: StyleProp<ViewStyle>;
}

export type TextComponent = (props: TextProps) => JSX.Element;

export type PosterComponent = (props: ImageProps) => JSX.Element;

export type IdMapping = Record<SFSymbol, string>;

export interface ControlProps {
  name: SFSymbol;
  translucent?: boolean;
  onPress?: () => void;
}

export type ControlComponent = (props: ControlProps) => JSX.Element;

export interface PlayerProps {
  source: Source;
  poster?: Source;
  fullscreen?: boolean;
}
