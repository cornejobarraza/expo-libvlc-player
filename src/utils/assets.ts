import resolveAssetSource from "react-native/Libraries/Image/resolveAssetSource";

import { LibVlcSource } from "../LibVlcPlayer.types";

export function parseSource(source: LibVlcSource): LibVlcSource {
  if (typeof source === "number") {
    return resolveAssetSource(source).uri;
  }

  return source;
}
