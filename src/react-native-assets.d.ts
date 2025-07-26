declare module "react-native/Libraries/Image/resolveAssetSource" {
  import { ResolvedAssetSource } from "react-native/Libraries/Image/AssetSourceResolver";

  export default function resolveAssetSource(
    source: number,
  ): ResolvedAssetSource;
}
