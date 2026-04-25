import { Image } from "react-native";

import { type LibVlcSlaveSource, type LibVlcSource } from "../LibVlcPlayer.types";

export function parseNativeSource(source: LibVlcSlaveSource): LibVlcSlaveSource;
export function parseNativeSource(source: LibVlcSource): LibVlcSource;
export function parseNativeSource(source: LibVlcSource): LibVlcSource {
  if (typeof source === "number") {
    return Image.resolveAssetSource(source).uri;
  }

  return source;
}
