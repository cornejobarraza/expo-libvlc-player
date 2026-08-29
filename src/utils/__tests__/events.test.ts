import { convertNativeEvent } from "../events";

const NATIVE_PROPS = { target: 1, timeStamp: 2 };

describe(convertNativeEvent, () => {
  it("strips target and timeStamp from the native event", () => {
    const event = {
      nativeEvent: { target: 21, timeStamp: 1234567890, value: 50 },
    };

    expect(convertNativeEvent(event)).toEqual({ value: 50 });
  });

  it("preserves all other event properties", () => {
    const event = {
      nativeEvent: {
        ...NATIVE_PROPS,
        path: "/path/to/recording.mp4",
        isRecording: true,
      },
    };

    expect(convertNativeEvent(event)).toEqual({
      path: "/path/to/recording.mp4",
      isRecording: true,
    });
  });

  it("preserves nested event properties", () => {
    const mediaInfo = {
      video: { width: 1920, height: 1080, frameRate: 30, bitrate: 5000 },
      metadata: { title: "Big Buck Bunny" },
      length: 634000,
      seekable: true,
    };

    const event = {
      nativeEvent: { ...NATIVE_PROPS, ...mediaInfo },
    };

    expect(convertNativeEvent(event)).toEqual(mediaInfo);
  });

  it("returns an empty object for events without a payload", () => {
    const event = { nativeEvent: { ...NATIVE_PROPS } };

    expect(convertNativeEvent(event)).toEqual({});
  });
});
