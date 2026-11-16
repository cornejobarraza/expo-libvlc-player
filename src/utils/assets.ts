import { Image } from "react-native";

import {
  type Asset,
  type Metadata,
  type Source,
  type PlayerProps,
  type Slave,
} from "../LibVlcPlayerView.types";

export function parseNativeSource(source: Asset): Asset;
export function parseNativeSource(source: Source): Source;
export function parseNativeSource(source: Source): Source {
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

export function parseNativeMetadata(metadata?: Metadata) {
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
