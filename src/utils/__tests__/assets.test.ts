import { Image } from "react-native";

import { parseNativeSlaves, parseNativeSource } from "../assets";

const ASSET_ID = 42;
const ASSET_URI = "file:///assets/video.mp4";
const AUDIO_URL = "https://example.com/audio.mp3";

describe(parseNativeSource, () => {
  it("resolves number sources to an asset uri", () => {
    const resolveAssetSource = jest
      .spyOn(Image, "resolveAssetSource")
      .mockReturnValue({ uri: ASSET_URI, width: 0, height: 0, scale: 1 });

    expect(parseNativeSource(ASSET_ID)).toBe(ASSET_URI);
    expect(resolveAssetSource).toHaveBeenCalledWith(ASSET_ID);
  });

  it("throws when a number source cannot be resolved", () => {
    jest.spyOn(Image, "resolveAssetSource").mockReturnValue(undefined);

    expect(() => parseNativeSource(ASSET_ID)).toThrow(
      `Unable to resolve asset source: ${ASSET_ID}`
    );
  });

  it("returns string sources unchanged", () => {
    const source = "https://example.com/video.mp4";

    expect(parseNativeSource(source)).toBe(source);
  });

  it("returns null sources unchanged", () => {
    expect(parseNativeSource(null)).toBeNull();
  });
});

describe(parseNativeSlaves, () => {
  it("resolves number sources and keeps the other slave fields", () => {
    jest
      .spyOn(Image, "resolveAssetSource")
      .mockReturnValue({ uri: ASSET_URI, width: 0, height: 0, scale: 1 });

    expect(
      parseNativeSlaves([
        { source: ASSET_ID, type: "subtitle", selected: true },
        { source: AUDIO_URL, type: "audio" },
      ])
    ).toEqual([
      { source: ASSET_URI, type: "subtitle", selected: true },
      { source: AUDIO_URL, type: "audio" },
    ]);
  });

  it("returns undefined slaves unchanged", () => {
    expect(parseNativeSlaves(undefined)).toBeUndefined();
  });
});
