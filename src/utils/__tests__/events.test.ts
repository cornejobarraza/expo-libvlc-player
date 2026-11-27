import { forwardNativeEvent } from "../events";

const NATIVE_PROPS = { target: 1, timeStamp: 2 };

describe(forwardNativeEvent, () => {
  it("strips target and timeStamp and keeps the rest of the event", () => {
    const listener = jest.fn();

    const mediaInfo = {
      media: { length: 634_000, seekable: true, pausable: true },
      video: { width: 1920, height: 1080, frameRate: 30, bitrate: 5_000 },
      metadata: { title: "Big Buck Bunny", artist: null, album: null, artworkURL: null },
    };

    forwardNativeEvent(listener)({ nativeEvent: { ...NATIVE_PROPS, ...mediaInfo } });

    expect(listener).toHaveBeenCalledWith(mediaInfo);
  });

  it("calls the listener with an empty object for events without a payload", () => {
    const listener = jest.fn();

    forwardNativeEvent(listener)({ nativeEvent: { ...NATIVE_PROPS } });

    expect(listener).toHaveBeenCalledWith({});
  });

  it("does nothing without a listener", () => {
    expect(() => {
      forwardNativeEvent<{ value: number }>()({ nativeEvent: { ...NATIVE_PROPS, value: 0.5 } });
    }).not.toThrow();
  });
});
