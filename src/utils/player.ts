import { useLayoutEffect, useImperativeHandle, useRef, type Ref, type RefObject } from "react";

import {
  type LibVlcPlayerViewNativeRef,
  type LibVlcPlayerViewProps,
  type LibVlcPlayerViewRef,
} from "../LibVlcPlayerView.types";
import { parseNativeProps } from "./assets";
import { convertPlayerProps } from "./props";

type PlayerRef = Ref<LibVlcPlayerViewRef> | undefined;

type NativeRef = RefObject<LibVlcPlayerViewNativeRef | null>;

const UNMOUNTED_MESSAGE = "LibVlcPlayerView is not mounted";

function callNative<T>(nativeRef: NativeRef, call: (player: LibVlcPlayerViewNativeRef) => T) {
  const player = nativeRef.current;

  return player ? call(player) : Promise.reject(new Error(UNMOUNTED_MESSAGE));
}

export function usePlayerRef(ref: PlayerRef, props: LibVlcPlayerViewProps) {
  const nativeRef = useRef<LibVlcPlayerViewNativeRef>(null);

  useImperativeHandle(
    ref,
    (): LibVlcPlayerViewRef => ({
      play: () => callNative(nativeRef, (player) => player.play()),
      pause: () => callNative(nativeRef, (player) => player.pause()),
      stop: () => callNative(nativeRef, (player) => player.stop()),
      seek: (value, type) => callNative(nativeRef, (player) => player.seek(value, type)),
      record: (path) => callNative(nativeRef, (player) => player.record(path)),
      snapshot: (path) => callNative(nativeRef, (player) => player.snapshot(path)),
      postAction: (action) => callNative(nativeRef, (player) => player.postAction(action)),
      postLogin: (username, password, store) =>
        callNative(nativeRef, (player) => player.postLogin(username, password, store)),
      dismiss: () => callNative(nativeRef, (player) => player.dismiss()),
      startPictureInPicture: () =>
        callNative(nativeRef, (player) => player.startPictureInPicture()),
      stopPictureInPicture: () => callNative(nativeRef, (player) => player.stopPictureInPicture()),
    }),
    []
  );

  const nativeProps = parseNativeProps(convertPlayerProps(props));

  const nativePropsKey = JSON.stringify(nativeProps);

  useLayoutEffect(() => {
    nativeRef.current?.update(nativeProps)?.catch(() => {});
  }, [nativePropsKey]);

  return nativeRef;
}
