import {
  VlcPlayerViewNativeProps,
  VlcPlayerViewProps,
} from "../VlcPlayer.types";

export function convertNativeProps(
  props?: VlcPlayerViewProps,
): VlcPlayerViewNativeProps {
  if (!props || typeof props !== "object") {
    return {};
  }

  const nativeProps: VlcPlayerViewNativeProps = {};

  for (const [key, value] of Object.entries(props)) {
    if (key in ({} as VlcPlayerViewNativeProps)) {
      (nativeProps as any)[key] = value;
    }
  }

  return nativeProps;
}
