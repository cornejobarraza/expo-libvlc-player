import { act, render } from "@testing-library/react-native";
import { Image, StyleSheet, Text } from "react-native";

import { type LibVlcPlayerViewNativeProps } from "../LibVlcPlayer.types";
import LibVlcPlayerView from "../LibVlcPlayerView";

const mockNativeViewRender = jest.fn();

jest.mock("expo", () => ({
  requireNativeView: jest.fn(() => (props: unknown) => {
    mockNativeViewRender(props);
    return null;
  }),
}));

// Jest transforms asset files into `{ testUri }` objects, but Metro resolves
// them to numeric module ids, so mock the asset to match runtime behavior
jest.mock("../../example/assets/bbb.mp4", () => 42);

const SOURCE = require("../../example/assets/bbb.mp4");
const SOURCE_URI = "file:///assets/bbb.mp4";
const VIDEO_URL = "https://example.com/video.mp4";
const AUDIO_URL = "https://example.com/audio.mp3";
const SUBTITLE_URI = "file:///assets/subtitle.srt";
const FALLBACK_RATIO = "16:9";

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
    jest
      .spyOn(Image, "resolveAssetSource")
      .mockReturnValue({ uri: SOURCE_URI, width: 0, height: 0, scale: 1 });
  });

  describe("children warning", () => {
    let warn: jest.SpyInstance;

    beforeEach(() => {
      warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warn.mockRestore();
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

    it("adopts the media ratio after onFirstPlay when aspectRatio is auto", async () => {
      jest.useFakeTimers();

      const { toJSON } = await render(
        <LibVlcPlayerView source={SOURCE} aspectRatio="auto" fallbackRatio={FALLBACK_RATIO} />
      );

      await act(async () => {
        getNativeProps().onFirstPlay?.({
          nativeEvent: {
            target: 1,
            timeStamp: 1,
            video: { width: 1280, height: 720, frameRate: 30, bitrate: 0 },
            metadata: {},
            length: 1000,
            seekable: true,
          },
        });
        jest.runAllTimers();
      });

      expect(getWrapperStyle(toJSON())).toMatchObject({ aspectRatio: 1280 / 720 });

      jest.useRealTimers();
    });

    it("keeps the fallback ratio when the media reports invalid dimensions", async () => {
      jest.useFakeTimers();

      const { toJSON } = await render(
        <LibVlcPlayerView source={SOURCE} aspectRatio="auto" fallbackRatio={FALLBACK_RATIO} />
      );

      await act(async () => {
        getNativeProps().onFirstPlay?.({
          nativeEvent: {
            target: 1,
            timeStamp: 1,
            video: { width: 0, height: 0, frameRate: 0, bitrate: 0 },
            metadata: {},
            length: 0,
            seekable: false,
          },
        });
        jest.runAllTimers();
      });

      expect(getWrapperStyle(toJSON())).toMatchObject({ aspectRatio: 16 / 9 });

      jest.useRealTimers();
    });
  });

  describe("source parsing", () => {
    it("passes string sources through to the native view", async () => {
      await render(<LibVlcPlayerView source={VIDEO_URL} />);

      expect(getNativeProps().source).toBe(VIDEO_URL);
    });

    it("passes null sources through to the native view", async () => {
      await render(<LibVlcPlayerView source={null} />);

      expect(getNativeProps().source).toBeNull();
    });

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

    it("passes undefined slaves through to the native view", async () => {
      await render(<LibVlcPlayerView source={SOURCE} />);

      expect(getNativeProps().slaves).toBeUndefined();
    });
  });

  describe("event conversion", () => {
    const nativeProps = { target: 1, timeStamp: 1234 };

    it.each([
      ["onBuffering", { value: 42 }],
      ["onEncounteredError", { message: "Failed to open media" }],
      ["onDialogDisplay", { title: "Insecure site", text: "Continue?", type: "question" }],
      ["onTimeChanged", { value: 1000 }],
      ["onPositionChanged", { value: 0.5 }],
      ["onESAdded", { audio: [{ id: 1, name: "Track 1" }], video: [], subtitle: [] }],
      ["onRecordChanged", { path: "/records", isRecording: true }],
      ["onSnapshotTaken", { path: "/snapshots/1.png" }],
    ] as const)("converts the native event for %s", async (name, payload) => {
      const listener = jest.fn();

      await render(<LibVlcPlayerView source={SOURCE} {...{ [name]: listener }} />);

      await act(async () => {
        (getNativeProps()[name] as (event: unknown) => void)({
          nativeEvent: { ...nativeProps, ...payload },
        });
      });

      expect(listener).toHaveBeenCalledWith(payload);
    });

    it("converts the native event for onFirstPlay", async () => {
      jest.useFakeTimers();

      const mediaInfo = {
        video: { width: 1920, height: 1080, frameRate: 30, bitrate: 5000 },
        metadata: { title: "Big Buck Bunny" },
        length: 634000,
        seekable: true,
      };

      const onFirstPlay = jest.fn();

      await render(<LibVlcPlayerView source={SOURCE} onFirstPlay={onFirstPlay} />);

      await act(async () => {
        getNativeProps().onFirstPlay?.({ nativeEvent: { ...nativeProps, ...mediaInfo } });
        jest.runAllTimers();
      });

      expect(onFirstPlay).toHaveBeenCalledWith(mediaInfo);

      jest.useRealTimers();
    });

    it("does not throw when native events fire without listeners", async () => {
      jest.useFakeTimers();

      await render(<LibVlcPlayerView source={SOURCE} />);
      const props = getNativeProps();

      await act(async () => {
        expect(() => {
          props.onBuffering?.({ nativeEvent: { ...nativeProps, value: 0 } });
          props.onEncounteredError?.({ nativeEvent: { ...nativeProps, message: "" } });
          props.onTimeChanged?.({ nativeEvent: { ...nativeProps, value: 0 } });
          props.onFirstPlay?.({
            nativeEvent: {
              ...nativeProps,
              video: { width: 1, height: 1, frameRate: 0, bitrate: 0 },
              metadata: {},
              length: 0,
              seekable: false,
            },
          });
          jest.runAllTimers();
        }).not.toThrow();
      });

      jest.useRealTimers();
    });
  });
});
