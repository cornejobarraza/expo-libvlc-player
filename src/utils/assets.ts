import { Image } from "react-native";

import { LibVlcSource } from "../LibVlcPlayer.types";

export function parseNativeSource(source: LibVlcSource): LibVlcSource {
  if (typeof source === "number") {
    return Image.resolveAssetSource(source).uri;
  }

  return source;
}
