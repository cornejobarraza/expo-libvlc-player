import { Image } from "react-native";

import {
  type LibVlcMetadata,
  type LibVlcSlaveSource,
  type LibVlcSource,
  type Slave,
} from "../LibVlcPlayerView.types";

export function parseNativeSource(source: LibVlcSlaveSource): LibVlcSlaveSource;
export function parseNativeSource(source: LibVlcSource): LibVlcSource;
export function parseNativeSource(source: LibVlcSource): LibVlcSource {
  if (typeof source === "number") {
    const asset = Image.resolveAssetSource(source);

    if (!asset) {
      throw new Error(`Unable to resolve asset source: ${source}`);
    }

    return asset.uri;
  }

  return source;
}

export function parseNativeSlaves(slaves?: Slave[]) {
  return slaves?.map((slave) => ({
    ...slave,
    source: parseNativeSource(slave.source),
  }));
}

function parseNativeArtwork(artworkURL?: LibVlcSource) {
  if (artworkURL != null) {
    return parseNativeSource(artworkURL);
  }

  return artworkURL !== null ? undefined : "";
}

export function parseNativeMetadata(metadata?: LibVlcMetadata) {
  return (
    metadata && {
      ...metadata,
      artworkURL: parseNativeArtwork(metadata.artworkURL),
    }
  );
}
