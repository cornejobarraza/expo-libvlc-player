import { Image } from "react-native";

import {
  type LibVlcMetadata,
  type LibVlcAsset,
  type LibVlcSource,
  type PlayerProps,
  type Slave,
} from "../LibVlcPlayerView.types";

export function parseNativeSource(source: LibVlcAsset): LibVlcAsset;
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

export function parseNativeMetadata(metadata?: LibVlcMetadata) {
  return (
    metadata && {
      ...metadata,
      ...(metadata.artworkURL && {
        artworkURL: parseNativeSource(metadata.artworkURL),
      }),
    }
  );
}

export function parseNativeProps(props: PlayerProps): PlayerProps {
  return {
    ...props,
    source: parseNativeSource(props.source),
    metadata: parseNativeMetadata(props.metadata),
    slaves: parseNativeSlaves(props.slaves),
  };
}
