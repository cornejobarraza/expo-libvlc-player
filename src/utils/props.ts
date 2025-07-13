import {
  LibVlcPlayerViewNativeProps,
  LibVlcPlayerViewProps,
} from "../LibVlcPlayer.types";

export function convertNativeProps(
  props?: LibVlcPlayerViewProps,
): LibVlcPlayerViewNativeProps {
  const nativeProps: LibVlcPlayerViewNativeProps = {};

  if (!props || typeof props !== "object") {
    return nativeProps;
  }

  for (const [key, value] of Object.entries(props)) {
    nativeProps[key as keyof LibVlcPlayerViewNativeProps] = value;
  }

  return nativeProps;
}
