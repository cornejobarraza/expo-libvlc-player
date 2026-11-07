import { Image } from "react-native";

import {
  parseNativeMetadata,
  parseNativeProps,
  parseNativeSlaves,
  parseNativeSource,
} from "../assets";

const ASSET_ID = 42;
const ASSET_URI = "file:///assets/video.mp4";
const AUDIO_URL = "https://example.com/audio.mp3";
const ARTWORK_URL = "https://example.com/artwork.png";
const METADATA = { title: "Big Buck Bunny", artist: "Blender Foundation" };

afterEach(() => {
  jest.restoreAllMocks();
});

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

describe(parseNativeMetadata, () => {
  it("resolves number artwork and keeps the other metadata fields", () => {
    jest
      .spyOn(Image, "resolveAssetSource")
      .mockReturnValue({ uri: ASSET_URI, width: 0, height: 0, scale: 1 });

    expect(parseNativeMetadata({ ...METADATA, artworkURL: ASSET_ID })).toEqual({
      ...METADATA,
      artworkURL: ASSET_URI,
    });
  });

  it("returns string artwork unchanged", () => {
    expect(parseNativeMetadata({ ...METADATA, artworkURL: ARTWORK_URL })).toEqual({
      ...METADATA,
      artworkURL: ARTWORK_URL,
    });
  });

  it("leaves missing artwork undefined", () => {
    expect(parseNativeMetadata(METADATA)).toStrictEqual(METADATA);
  });

  it("returns undefined metadata unchanged", () => {
    expect(parseNativeMetadata(undefined)).toBeUndefined();
  });
});

describe(parseNativeProps, () => {
  it("resolves every asset and keeps the other props", () => {
    jest
      .spyOn(Image, "resolveAssetSource")
      .mockReturnValue({ uri: ASSET_URI, width: 0, height: 0, scale: 1 });

    expect(
      parseNativeProps({
        source: ASSET_ID,
        metadata: { ...METADATA, artworkURL: ASSET_ID },
        options: ["--network-caching=1000"],
        slaves: [{ source: ASSET_ID, type: "audio" }],
        tracks: { audio: 1 },
        time: 30_000,
        autoplay: false,
      })
    ).toStrictEqual({
      source: ASSET_URI,
      metadata: { ...METADATA, artworkURL: ASSET_URI },
      options: ["--network-caching=1000"],
      slaves: [{ source: ASSET_URI, type: "audio" }],
      tracks: { audio: 1 },
      time: 30_000,
      autoplay: false,
    });
  });

  it("leaves absent metadata and slaves undefined", () => {
    expect(parseNativeProps({ source: null, time: 0 })).toStrictEqual({
      source: null,
      metadata: undefined,
      slaves: undefined,
      time: 0,
    });
  });
});
