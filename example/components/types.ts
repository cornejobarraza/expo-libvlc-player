import { MaterialIcons } from "@expo/vector-icons";
import { LibVlcSource } from "expo-libvlc-player";
import { SFSymbol } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, StyleProp, TextStyle, ViewStyle } from "react-native";

export interface FocusableProps {
  name: SFSymbol;
  focused?: boolean;
  onFocus?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export interface IconSymbolIosProps {
  style?: StyleProp<ViewStyle>;
  name: SFSymbol;
  size?: number;
  color: string;
}

export interface IconSymbolProps {
  style?: StyleProp<TextStyle>;
  name: SFSymbol;
  size?: number;
  color: string | OpaqueColorValue;
}

export type MaterialIcon = ComponentProps<typeof MaterialIcons>["name"];

export type IconMapping = Record<SFSymbol, MaterialIcon>;

export interface LibVlcPlayerProps {
  source: LibVlcSource;
  title?: string;
  fullScreen?: boolean;
}

export interface PlayerControl {
  name: SFSymbol;
  onPress: () => void;
}

export type TimeoutRef = ReturnType<typeof setTimeout>;
