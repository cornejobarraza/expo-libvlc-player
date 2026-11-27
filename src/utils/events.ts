import { type NativeEvent } from "../LibVlcPlayerView.types";

export function forwardNativeEvent<T>(listener?: (event: T) => void) {
  return (event: NativeEvent<T>) => {
    const { target, timeStamp, ...nativeEvent } = event.nativeEvent;
    listener?.(nativeEvent as T);
  };
}
