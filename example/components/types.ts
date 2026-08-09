import { type MaterialIcons } from "@expo/vector-icons";
import { type LibVlcSource } from "expo-libvlc-player";
import { type SFSymbol } from "expo-symbols";
import { type ComponentProps } from "react";
import { type OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

export type MaterialIcon = ComponentProps<typeof MaterialIcons>["name"];

export type IconMapping = Record<SFSymbol, MaterialIcon>;

export interface IconSymbolProps {
  style?: StyleProp<TextStyle>;
  name: SFSymbol;
  size?: number;
  color: string | OpaqueColorValue;
}

export interface VlcControlProps {
  name: SFSymbol;
  onPress?: () => void;
}

export interface VlcPlayerProps {
  source: LibVlcSource;
  fullScreen?: boolean;
}

export interface PlayerControl {
  name: SFSymbol;
  onPress: () => void;
}
