import { useLayoutEffect, useImperativeHandle, useRef, type Ref } from "react";

import {
  type LibVlcPlayerViewNativeRef,
  type LibVlcPlayerViewRef,
  type PlayerProps,
} from "../LibVlcPlayerView.types";

type PlayerRef = Ref<LibVlcPlayerViewRef> | undefined;

export function usePlayerRef(ref: PlayerRef, props: PlayerProps) {
  const nativeRef = useRef<LibVlcPlayerViewNativeRef>(null);

  useImperativeHandle(
    ref,
    (): LibVlcPlayerViewRef => ({
      play: async () => nativeRef.current?.play(),
      pause: async () => nativeRef.current?.pause(),
      stop: async () => nativeRef.current?.stop(),
      seek: async (value, type) => nativeRef.current?.seek(value, type),
      record: async (path) => nativeRef.current?.record(path),
      snapshot: async (path) => nativeRef.current?.snapshot(path),
      postAction: async (action) => nativeRef.current?.postAction(action),
      postLogin: async (username, password, store) =>
        nativeRef.current?.postLogin(username, password, store),
      dismiss: async () => nativeRef.current?.dismiss(),
      startPictureInPicture: async () => nativeRef.current?.startPictureInPicture(),
      stopPictureInPicture: async () => nativeRef.current?.stopPictureInPicture(),
    }),
    []
  );

  useLayoutEffect(() => {
    nativeRef.current?.update(props)?.catch(() => {});
  }, [JSON.stringify(props)]);

  return nativeRef;
}
