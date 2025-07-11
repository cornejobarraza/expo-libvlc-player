import {
  VlcPlayerViewNativeProps,
  VlcPlayerViewProps,
} from "../VlcPlayer.types";

export function convertNativeProps(
  props?: VlcPlayerViewProps,
): VlcPlayerViewNativeProps {
  const nativeProps: VlcPlayerViewNativeProps = {};

  if (!props || typeof props !== "object") {
    return nativeProps;
  }

  for (const [key, value] of Object.entries(props)) {
    nativeProps[key as keyof VlcPlayerViewNativeProps] = value;
  }

  return nativeProps;
}
