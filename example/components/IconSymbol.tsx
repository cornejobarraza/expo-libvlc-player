import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { type IconMapping, type IconSymbolProps } from "./types";

const MAPPING = {
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "forward.fill": "fast-forward",
  "backward.fill": "fast-rewind",
  "speaker.1.fill": "volume-down",
  "speaker.3.fill": "volume-up",
} as IconMapping;

export function IconSymbol({ style, name, size = 24, color }: IconSymbolProps) {
  return <MaterialIcons style={style} name={MAPPING[name]} size={size} color={color} />;
}
