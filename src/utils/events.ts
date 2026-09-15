import { type NativeEvent } from "../LibVlcPlayerView.types";

export function convertNativeEvent<T>(event: NativeEvent<T>) {
  const { target, timeStamp, ...nativeEvent } = event.nativeEvent;
  return nativeEvent;
}
