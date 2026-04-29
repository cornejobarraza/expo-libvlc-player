import { type MaterialIcons } from "@expo/vector-icons";
import { type LibVlcSource } from "expo-libvlc-player";
import { type SFSymbol } from "expo-symbols";
import { type ComponentProps } from "react";
import {
  type OpaqueColorValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

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
