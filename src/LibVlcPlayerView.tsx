import { requireNativeView } from "expo";
import { forwardRef, type ComponentType } from "react";

import {
  LibVlcPlayerViewNativeProps,
  LibVlcPlayerViewProps,
  LibVlcPlayerViewRef,
  type Error,
  type PositionChanged,
  type VideoInfo,
  type Background,
} from "./LibVlcPlayer.types";
import { convertNativeProps } from "./utils/props";

const NativeView: ComponentType<LibVlcPlayerViewNativeProps> =
  requireNativeView("ExpoLibVlcPlayer");

let loggedRenderingChildrenWarning: boolean = false;

const LibVlcPlayerView = forwardRef<LibVlcPlayerViewRef, LibVlcPlayerViewProps>(
  (props, ref) => {
    const nativeProps = convertNativeProps(props);

    // @ts-expect-error
    if (nativeProps.children && !loggedRenderingChildrenWarning) {
      console.warn(
        "The <LibVlcPlayerView> component does not support children. This may lead to inconsistent behaviour or crashes. If you want to render content on top of the LibVlcPlayer, consider using absolute positioning.",
      );
      loggedRenderingChildrenWarning = true;
    }

    const onError = ({ nativeEvent }: { nativeEvent: Error }) => {
      if (props.onError) {
        props.onError(nativeEvent);
      }
    };

    const onPositionChanged = ({
      nativeEvent,
    }: {
      nativeEvent: PositionChanged;
    }) => {
      if (props.onPositionChanged) {
        props.onPositionChanged(nativeEvent);
      }
    };

    const onLoad = ({ nativeEvent }: { nativeEvent: VideoInfo }) => {
      if (props.onLoad) {
        props.onLoad(nativeEvent);
      }
    };

    const onBackground = ({ nativeEvent }: { nativeEvent: Background }) => {
      if (props.onBackground) {
        props.onBackground(nativeEvent);
      }
    };

    return (
      <NativeView
        {...nativeProps}
        ref={ref}
        onError={onError}
        onPositionChanged={onPositionChanged}
        onLoad={onLoad}
        onBackground={onBackground}
      />
    );
  },
);

export default LibVlcPlayerView;
