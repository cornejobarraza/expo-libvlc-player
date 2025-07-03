import { requireNativeView } from "expo";
import * as React from "react";

import {
  VlcPlayerViewNativeProps,
  VlcPlayerViewProps,
  VLCPlayerViewRef,
  type Warn,
  type Error,
  type PositionChanged,
  type VideoInfo,
} from "./VlcPlayer.types";
import { convertNativeProps } from "./utils/props";

const NativeView: React.ComponentType<VlcPlayerViewNativeProps> =
  requireNativeView("ExpoLibVlcPlayer");

let loggedRenderingChildrenWarning = false;

const VlcPlayerView = React.forwardRef<VLCPlayerViewRef, VlcPlayerViewProps>(
  (props, ref) => {
    const nativeProps = convertNativeProps(props);

    // @ts-expect-error
    if (nativeProps.children && !loggedRenderingChildrenWarning) {
      console.warn(
        "The <VLCPlayerView> component does not support children. This may lead to inconsistent behaviour or crashes. If you want to render content on top of the VLCPlayer, consider using absolute positioning.",
      );
      loggedRenderingChildrenWarning = true;
    }

    const onWarn = ({ nativeEvent }: { nativeEvent: Warn }) => {
      if (props.onWarn) {
        props.onWarn(nativeEvent);
      }
    };

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

    return (
      <NativeView
        {...nativeProps}
        ref={ref}
        onWarn={onWarn}
        onError={onError}
        onPositionChanged={onPositionChanged}
        onLoad={onLoad}
      />
    );
  },
);

export default VlcPlayerView;
