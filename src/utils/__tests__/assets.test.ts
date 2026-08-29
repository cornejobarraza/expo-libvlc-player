import { Image } from "react-native";

import { parseNativeSource } from "../assets";

const ASSET_ID = 42;
const ASSET_URI = "file:///assets/video.mp4";

describe(parseNativeSource, () => {
  it("resolves number sources to an asset uri", () => {
    const resolveAssetSource = jest
      .spyOn(Image, "resolveAssetSource")
      .mockReturnValue({ uri: ASSET_URI, width: 0, height: 0, scale: 1 });

    expect(parseNativeSource(ASSET_ID)).toBe(ASSET_URI);
    expect(resolveAssetSource).toHaveBeenCalledWith(ASSET_ID);
  });

  it("returns string sources unchanged", () => {
    const source = "https://example.com/video.mp4";

    expect(parseNativeSource(source)).toBe(source);
  });

  it("returns null sources unchanged", () => {
    expect(parseNativeSource(null)).toBeNull();
  });
});
