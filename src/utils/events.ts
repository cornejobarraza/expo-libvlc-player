import { type NativeEvent } from "../LibVlcPlayer.types";

export function convertNativeEvent<T>(event: NativeEvent<T>) {
  const { target, timeStamp, ...nativeEvent } = event.nativeEvent;
  return nativeEvent;
}
