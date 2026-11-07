import { renderHook } from "@testing-library/react-native";
import { createRef } from "react";
import { Image } from "react-native";

import {
  type LibVlcPlayerViewNativeRef,
  type LibVlcPlayerViewProps,
  type LibVlcPlayerViewRef,
} from "../../LibVlcPlayerView.types";
import { usePlayerRef } from "../player";
import { PLAYER_PROP_KEYS } from "../props";

const ASSET_ID = 42;
const ASSET_URI = "file:///assets/video.mp4";
const VIDEO_URL = "https://example.com/video.mp4";

const UNSET_PLAYER_PROPS = Object.fromEntries(PLAYER_PROP_KEYS.map((key) => [key, undefined]));

function createNativeRef(): LibVlcPlayerViewNativeRef {
  return {
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    seek: jest.fn(),
    record: jest.fn(),
    snapshot: jest.fn(),
    postAction: jest.fn(),
    postLogin: jest.fn(),
    dismiss: jest.fn(),
    startPictureInPicture: jest.fn(),
    stopPictureInPicture: jest.fn(),
    update: jest.fn(),
  };
}

async function renderPlayerRef(initialProps: LibVlcPlayerViewProps) {
  const ref = createRef<LibVlcPlayerViewRef>();
  const nativeRef = createNativeRef();

  const { rerender } = await renderHook(
    (props: LibVlcPlayerViewProps) => {
      const playerRef = usePlayerRef(ref, props);
      playerRef.current = nativeRef;
      return playerRef;
    },
    { initialProps }
  );

  return { nativeRef, rerender };
}

describe(usePlayerRef, () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("updates the native ref with the parsed player props on mount", async () => {
    jest
      .spyOn(Image, "resolveAssetSource")
      .mockReturnValue({ uri: ASSET_URI, width: 0, height: 0, scale: 1 });

    const { nativeRef } = await renderPlayerRef({
      source: ASSET_ID,
      volume: 50,
      style: { width: 200 },
      onPlaying: () => {},
    });

    expect(nativeRef.update).toHaveBeenCalledTimes(1);
    expect(nativeRef.update).toHaveBeenCalledWith({
      ...UNSET_PLAYER_PROPS,
      source: ASSET_URI,
      volume: 50,
    });
  });

  it("does not update the native ref when the player props are unchanged", async () => {
    const { nativeRef, rerender } = await renderPlayerRef({ source: VIDEO_URL, volume: 50 });

    await rerender({ source: VIDEO_URL, volume: 50, style: { width: 200 } });

    expect(nativeRef.update).toHaveBeenCalledTimes(1);
  });

  it("updates the native ref when a player prop changes", async () => {
    const { nativeRef, rerender } = await renderPlayerRef({ source: VIDEO_URL, volume: 50 });

    await rerender({ source: VIDEO_URL, volume: 75 });

    expect(nativeRef.update).toHaveBeenCalledTimes(2);
    expect(nativeRef.update).toHaveBeenLastCalledWith(expect.objectContaining({ volume: 75 }));
  });

  it("does not update the native ref when inline props are recreated with the same values", async () => {
    const { nativeRef, rerender } = await renderPlayerRef({
      source: VIDEO_URL,
      options: ["--network-caching=1000"],
      tracks: { audio: 1 },
      metadata: { title: "Big Buck Bunny" },
    });

    await rerender({
      source: VIDEO_URL,
      options: ["--network-caching=1000"],
      tracks: { audio: 1 },
      metadata: { title: "Big Buck Bunny" },
    });

    expect(nativeRef.update).toHaveBeenCalledTimes(1);
  });

  it("updates the native ref when a nested player prop value changes", async () => {
    const { nativeRef, rerender } = await renderPlayerRef({
      source: VIDEO_URL,
      tracks: { audio: 1 },
    });

    await rerender({ source: VIDEO_URL, tracks: { audio: 2 } });

    expect(nativeRef.update).toHaveBeenCalledTimes(2);
    expect(nativeRef.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ tracks: { audio: 2 } })
    );
  });

  it("handles a rejected native update", async () => {
    const rejection = Promise.reject(new Error("Unable to find the view"));
    const catchSpy = jest.spyOn(rejection, "catch");

    const ref = createRef<LibVlcPlayerViewRef>();
    const nativeRef = createNativeRef();
    jest.mocked(nativeRef.update).mockReturnValue(rejection);

    await renderHook(() => {
      const playerRef = usePlayerRef(ref, { source: VIDEO_URL });
      playerRef.current = nativeRef;
      return playerRef;
    });

    expect(catchSpy).toHaveBeenCalledTimes(1);
  });

  it("sends a removed player prop as undefined so native resets it", async () => {
    const { nativeRef, rerender } = await renderPlayerRef({ source: VIDEO_URL, volume: 50 });

    await rerender({ source: VIDEO_URL });

    expect(nativeRef.update).toHaveBeenCalledTimes(2);
    expect(nativeRef.update).toHaveBeenLastCalledWith({
      ...UNSET_PLAYER_PROPS,
      source: VIDEO_URL,
    });
  });
});
