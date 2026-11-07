import { convertNativeEvent } from "../events";

const NATIVE_PROPS = { target: 1, timeStamp: 2 };

describe(convertNativeEvent, () => {
  it("strips target and timeStamp and keeps the rest of the event", () => {
    const mediaInfo = {
      media: { length: 634000, seekable: true },
      metadata: { title: "Big Buck Bunny", artist: null, artworkURL: null },
      video: { width: 1920, height: 1080, frameRate: 30, bitrate: 5000 },
    };

    const event = {
      nativeEvent: { ...NATIVE_PROPS, ...mediaInfo },
    };

    expect(convertNativeEvent(event)).toStrictEqual(mediaInfo);
  });

  it("returns an empty object for events without a payload", () => {
    const event = { nativeEvent: { ...NATIVE_PROPS } };

    expect(convertNativeEvent(event)).toStrictEqual({});
  });
});
