import { act, render } from "@testing-library/react-native";
import { createRef, useLayoutEffect, useRef } from "react";
import { Image, StyleSheet, Text } from "react-native";

import LibVlcPlayerView from "../LibVlcPlayerView";
import {
  type LibVlcPlayerViewNativeProps,
  type LibVlcPlayerViewRef,
  type PlayerProps,
} from "../LibVlcPlayerView.types";

const mockNativeViewRender = jest.fn();
const mockNativeFunction = jest.fn();
const mockUpdate = jest.fn();

jest.mock("expo", () => {
  const { Component } = jest.requireActual("react");

  class MockNativeView extends Component {
    nativeTag = 1;

    render() {
      mockNativeViewRender(this.props);
      return null;
    }

    update(props: unknown) {
      return mockUpdate.call(this, props);
    }
  }

  const functionNames = [
    "play",
    "pause",
    "stop",
    "seek",
    "record",
    "snapshot",
    "postAction",
    "postLogin",
    "dismiss",
    "startPictureInPicture",
    "stopPictureInPicture",
  ];

  for (const name of functionNames) {
    MockNativeView.prototype[name] = function (...args: unknown[]) {
      return mockNativeFunction.call(this, name, ...args);
    };
  }

  return { requireNativeView: jest.fn(() => MockNativeView) };
});

const SOURCE = 42;
const SOURCE_URI = "file:///assets/bbb.mp4";
const VIDEO_URL = "https://example.com/video.mp4";
const AUDIO_URL = "https://example.com/audio.mp3";
const SUBTITLE_URI = "file:///assets/subtitle.srt";
const ARTWORK_URI = "file:///assets/bbb.png";
const METADATA = { title: "Big Buck Bunny", artist: "Blender Foundation" };
const FALLBACK_RATIO = "16:9";

const PLAYER_PROPS = {
  source: VIDEO_URL,
  metadata: METADATA,
  options: ["--network-caching=1000"],
  slaves: [{ source: AUDIO_URL, type: "audio" }],
  tracks: { audio: 1 },
  delays: { subtitle: 1_000_000 },
  scale: 2,
  contentFit: "cover",
  rate: 1.5,
  time: 30_000,
  volume: 50,
  mute: true,
  repeat: true,
  autoplay: false,
  audioMixingMode: "duckOthers",
  playInBackground: true,
  pictureInPicture: true,
} satisfies Required<PlayerProps>;

const REF_CALLS: { [K in keyof LibVlcPlayerViewRef]: Parameters<LibVlcPlayerViewRef[K]> } = {
  play: [],
  pause: [],
  stop: [],
  seek: [1000, "time"],
  record: ["/records"],
  snapshot: ["/snapshots"],
  postAction: [1],
  postLogin: ["user", "pass", true],
  dismiss: [],
  startPictureInPicture: [],
  stopPictureInPicture: [],
};

const EVENT_PAYLOADS = [
  ["onBuffering", { value: 42 }],
  ["onEncounteredError", { message: "Failed to open media" }],
  ["onDialogDisplay", { title: "Insecure site", text: "Continue?", type: "question" }],
  ["onTimeChanged", { value: 1000 }],
  ["onPositionChanged", { value: 0.5 }],
  ["onESAdded", { audio: [{ id: 1, name: "Track 1" }], video: [], subtitle: [] }],
  ["onRecordChanged", { path: "/records", isRecording: true }],
  ["onSnapshotTaken", { path: "/snapshots/1.png" }],
] as const;

const NATIVE_EVENT_PROPS = { target: 1, timeStamp: 1234 };

function createMediaInfo(width: number, height: number) {
  return {
    media: { length: 634_000, seekable: true },
    metadata: { title: "Big Buck Bunny", artist: null, album: null, artworkURL: null },
    video: { width, height, frameRate: 30, bitrate: 5000 },
  };
}

function createFirstPlayEvent(width: number, height: number) {
  return { nativeEvent: { ...NATIVE_EVENT_PROPS, ...createMediaInfo(width, height) } };
}

function getNativeProps(): LibVlcPlayerViewNativeProps {
  const lastCall = mockNativeViewRender.mock.lastCall;

  if (!lastCall) {
    throw new Error("NativeView was not rendered");
  }

  return lastCall[0];
}

function getWrapperStyle(json: unknown) {
  const tree = json as { props: { style: Parameters<typeof StyleSheet.flatten>[0] } };
  return StyleSheet.flatten(tree.props.style);
}

describe("LibVlcPlayerView", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest
      .spyOn(Image, "resolveAssetSource")
      .mockReturnValue({ uri: SOURCE_URI, width: 0, height: 0, scale: 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("children warning", () => {
    let warn: jest.SpyInstance;

    beforeEach(() => {
      warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    it("warns once when children are passed", async () => {
      const { rerender } = await render(
        <LibVlcPlayerView source={SOURCE}>
          <Text>Overlay</Text>
        </LibVlcPlayerView>
      );

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("does not support children"));

      await rerender(
        <LibVlcPlayerView source={SOURCE}>
          <Text>Overlay</Text>
        </LibVlcPlayerView>
      );

      expect(warn).toHaveBeenCalledTimes(1);
    });

    it("does not warn without children", async () => {
      await render(<LibVlcPlayerView source={SOURCE} />);

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe("aspect ratio", () => {
    it("converts ratio strings on the wrapper view", async () => {
      const { toJSON } = await render(<LibVlcPlayerView source={SOURCE} aspectRatio="16:9" />);

      expect(getWrapperStyle(toJSON())).toMatchObject({ aspectRatio: 16 / 9 });
    });

    it("passes number ratios through to the wrapper view", async () => {
      const { toJSON } = await render(<LibVlcPlayerView source={SOURCE} aspectRatio={1.5} />);

      expect(getWrapperStyle(toJSON())).toMatchObject({ aspectRatio: 1.5 });
    });

    it("merges the user style with the wrapper ratio", async () => {
      const { toJSON } = await render(
        <LibVlcPlayerView source={SOURCE} aspectRatio="4:3" style={{ width: 200 }} />
      );

      expect(getWrapperStyle(toJSON())).toMatchObject({ width: 200, aspectRatio: 4 / 3 });
    });

    it("uses the fallback ratio when aspectRatio is auto", async () => {
      const { toJSON } = await render(
        <LibVlcPlayerView source={SOURCE} aspectRatio="auto" fallbackRatio={FALLBACK_RATIO} />
      );

      expect(getWrapperStyle(toJSON())).toMatchObject({ aspectRatio: 16 / 9 });
    });

    it.each([
      [0, 0],
      [1280, 0],
      [0, 720],
    ])("returns to the fallback ratio when the media reports %ix%i", async (width, height) => {
      jest.useFakeTimers();

      const { toJSON } = await render(
        <LibVlcPlayerView source={SOURCE} aspectRatio="auto" fallbackRatio={FALLBACK_RATIO} />
      );

      await act(async () => {
        getNativeProps().onFirstPlay?.(createFirstPlayEvent(1280, 960));
        jest.runAllTimers();
        getNativeProps().onFirstPlay?.(createFirstPlayEvent(width, height));
        jest.runAllTimers();
      });

      expect(getWrapperStyle(toJSON())).toMatchObject({ aspectRatio: 16 / 9 });
    });
  });

  describe("auto ratio timing", () => {
    it("waits for the resize delay before adopting the media ratio", async () => {
      jest.useFakeTimers();

      const { toJSON } = await render(
        <LibVlcPlayerView source={SOURCE} aspectRatio="auto" fallbackRatio={FALLBACK_RATIO} />
      );

      await act(async () => {
        getNativeProps().onFirstPlay?.(createFirstPlayEvent(1280, 960));
        jest.advanceTimersByTime(299);
      });

      expect(getWrapperStyle(toJSON())).toMatchObject({ aspectRatio: 16 / 9 });

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(getWrapperStyle(toJSON())).toMatchObject({ aspectRatio: 1280 / 960 });
    });

    it("ignores the media ratio when aspectRatio is not auto", async () => {
      jest.useFakeTimers();

      const { toJSON } = await render(<LibVlcPlayerView source={SOURCE} aspectRatio="4:3" />);

      await act(async () => {
        getNativeProps().onFirstPlay?.(createFirstPlayEvent(1920, 1080));
        jest.runAllTimers();
      });

      expect(getWrapperStyle(toJSON())).toMatchObject({ aspectRatio: 4 / 3 });
    });

    it("applies only the latest ratio when onFirstPlay fires again", async () => {
      jest.useFakeTimers();

      const { toJSON } = await render(
        <LibVlcPlayerView source={SOURCE} aspectRatio="auto" fallbackRatio={FALLBACK_RATIO} />
      );

      await act(async () => {
        getNativeProps().onFirstPlay?.(createFirstPlayEvent(400, 400));
        jest.advanceTimersByTime(200);
        getNativeProps().onFirstPlay?.(createFirstPlayEvent(1280, 960));
        jest.advanceTimersByTime(299);
      });

      expect(getWrapperStyle(toJSON())).toMatchObject({ aspectRatio: 16 / 9 });

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(getWrapperStyle(toJSON())).toMatchObject({ aspectRatio: 1280 / 960 });
    });

    it("cancels the pending ratio update on unmount", async () => {
      jest.useFakeTimers();

      const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");
      const clearTimeoutSpy = jest.spyOn(globalThis, "clearTimeout");

      const { unmount } = await render(
        <LibVlcPlayerView source={SOURCE} aspectRatio="auto" fallbackRatio={FALLBACK_RATIO} />
      );

      await act(async () => {
        getNativeProps().onFirstPlay?.(createFirstPlayEvent(1280, 720));
      });

      const ratioCall = setTimeoutSpy.mock.calls.findIndex(([, delay]) => delay === 300);
      const ratioTimeout = setTimeoutSpy.mock.results[ratioCall]?.value;

      expect(ratioTimeout).toBeDefined();

      await unmount();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(ratioTimeout);
    });
  });

  describe("native view props", () => {
    it("stretches the native view to fill the wrapper", async () => {
      await render(<LibVlcPlayerView source={SOURCE} style={{ width: 200 }} />);

      expect(StyleSheet.flatten(getNativeProps().style)).toMatchObject({
        width: 200,
        height: "100%",
      });
    });

    it.each([
      "onPlaying",
      "onPaused",
      "onStopped",
      "onDialogCanceled",
      "onForeground",
      "onBackground",
      "onPictureInPictureStart",
      "onPictureInPictureStop",
    ] as const)("passes the %s listener through untouched", async (name) => {
      const listener = jest.fn();

      await render(<LibVlcPlayerView source={SOURCE} {...{ [name]: listener }} />);

      expect(getNativeProps()[name]).toBe(listener);
    });

    it("passes every player prop to the native view", async () => {
      await render(<LibVlcPlayerView {...PLAYER_PROPS} />);

      expect(getNativeProps()).toMatchObject(PLAYER_PROPS);
    });
  });

  describe("ref", () => {
    it.each(Object.entries(REF_CALLS) as [keyof LibVlcPlayerViewRef, unknown[]][])(
      "forwards %s to the native view",
      async (name, args) => {
        const ref = createRef<LibVlcPlayerViewRef>();

        await render(<LibVlcPlayerView ref={ref} source={SOURCE} />);

        const player = ref.current!;
        const call = player[name] as (...args: unknown[]) => Promise<void>;

        await call.apply(player, args);

        expect(mockNativeFunction).toHaveBeenCalledTimes(1);
        expect(mockNativeFunction).toHaveBeenCalledWith(name, ...args);
        expect(mockNativeFunction.mock.contexts[0]).toMatchObject({ nativeTag: 1 });
      }
    );

    it("updates the native view once on mount", async () => {
      await render(<LibVlcPlayerView source={SOURCE} />);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate.mock.contexts[0]).toMatchObject({ nativeTag: 1 });
    });

    it("updates the native view before the parent's layout effects use the ref", async () => {
      const Parent = () => {
        const ref = useRef<LibVlcPlayerViewRef>(null);

        useLayoutEffect(() => {
          ref.current?.play();
        }, []);

        return <LibVlcPlayerView ref={ref} source={VIDEO_URL} />;
      };

      await render(<Parent />);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockNativeFunction).toHaveBeenCalledWith("play");
      expect(mockUpdate.mock.invocationCallOrder[0]).toBeLessThan(
        mockNativeFunction.mock.invocationCallOrder[0]!
      );
    });

    it("does not expose the native update function", async () => {
      const ref = createRef<LibVlcPlayerViewRef>();

      await render(<LibVlcPlayerView ref={ref} source={SOURCE} />);

      expect(ref.current && "update" in ref.current).toBe(false);
    });

    it("clears the ref on unmount", async () => {
      const ref = createRef<LibVlcPlayerViewRef>();

      const { unmount } = await render(<LibVlcPlayerView ref={ref} source={SOURCE} />);

      await unmount();

      expect(ref.current).toBeNull();
    });
  });

  describe("source parsing", () => {
    it("resolves require assets to an asset uri", async () => {
      await render(<LibVlcPlayerView source={SOURCE} />);

      expect(getNativeProps().source).toBe(SOURCE_URI);
    });

    it("resolves slave sources", async () => {
      jest
        .spyOn(Image, "resolveAssetSource")
        .mockReturnValue({ uri: SUBTITLE_URI, width: 0, height: 0, scale: 1 });

      await render(
        <LibVlcPlayerView
          source={VIDEO_URL}
          slaves={[
            { source: 7, type: "subtitle", selected: true },
            { source: AUDIO_URL, type: "audio" },
          ]}
        />
      );

      expect(getNativeProps().slaves).toEqual([
        { source: SUBTITLE_URI, type: "subtitle", selected: true },
        { source: AUDIO_URL, type: "audio" },
      ]);
    });

    it("resolves metadata artwork sources", async () => {
      jest
        .spyOn(Image, "resolveAssetSource")
        .mockReturnValue({ uri: ARTWORK_URI, width: 0, height: 0, scale: 1 });

      await render(
        <LibVlcPlayerView source={VIDEO_URL} metadata={{ ...METADATA, artworkURL: 7 }} />
      );

      expect(getNativeProps().metadata).toEqual({ ...METADATA, artworkURL: ARTWORK_URI });
    });
  });

  describe("event conversion", () => {
    it.each(EVENT_PAYLOADS)("converts the native event for %s", async (name, payload) => {
      const listener = jest.fn();

      await render(<LibVlcPlayerView source={SOURCE} {...{ [name]: listener }} />);

      await act(async () => {
        (getNativeProps()[name] as (event: unknown) => void)({
          nativeEvent: { ...NATIVE_EVENT_PROPS, ...payload },
        });
      });

      expect(listener).toHaveBeenCalledWith(payload);
    });

    it("converts the native event for onFirstPlay", async () => {
      jest.useFakeTimers();

      const onFirstPlay = jest.fn();

      await render(<LibVlcPlayerView source={SOURCE} onFirstPlay={onFirstPlay} />);

      await act(async () => {
        getNativeProps().onFirstPlay?.(createFirstPlayEvent(1920, 1080));
        jest.runAllTimers();
      });

      expect(onFirstPlay).toHaveBeenCalledWith(createMediaInfo(1920, 1080));
    });

    it("does not throw when native events fire without listeners", async () => {
      jest.useFakeTimers();

      await render(<LibVlcPlayerView source={SOURCE} />);
      const props = getNativeProps();

      await act(async () => {
        expect(() => {
          for (const [name, payload] of EVENT_PAYLOADS) {
            (props[name] as (event: unknown) => void)({
              nativeEvent: { ...NATIVE_EVENT_PROPS, ...payload },
            });
          }
          props.onFirstPlay?.(createFirstPlayEvent(1, 1));
          jest.runAllTimers();
        }).not.toThrow();
      });
    });
  });
});
