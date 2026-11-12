import type MaterialIcons from "@react-native-vector-icons/material-icons";
import { type LibVlcSource } from "expo-libvlc-player";
import { type SFSymbol } from "expo-symbols";
import { type JSX, type ComponentProps } from "react";
import {
  type DimensionValue,
  type ImageProps,
  type TextProps,
  type StyleProp,
  type TextStyle,
  type NativeColorValue,
  type ViewStyle,
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
  poster?: LibVlcSource;
  fullscreen?: boolean;
}

export type SkeletonProps = {
  style?: StyleProp<ViewStyle>;
};

export type PosterLoadingProps = {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
};

export type LoadingProps = {
  width: DimensionValue;
  height: number;
};

export type TextComponent = (props: TextProps) => JSX.Element;

export type PosterComponent = (props: ImageProps) => JSX.Element;

export type ControlComponent = (props: ControlProps) => JSX.Element;
