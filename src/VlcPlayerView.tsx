import { requireNativeView } from "expo";
import { forwardRef, type ComponentType } from "react";

import {
  VlcPlayerViewNativeProps,
  VlcPlayerViewProps,
  VLCPlayerViewRef,
  type Paused,
  type Warn,
  type Error,
  type PositionChanged,
  type VideoInfo,
} from "./VlcPlayer.types";
import { convertNativeProps } from "./utils/props";

const NativeView: ComponentType<VlcPlayerViewNativeProps> =
  requireNativeView("ExpoLibVlcPlayer");

let loggedRenderingChildrenWarning = false;

const VlcPlayerView = forwardRef<VLCPlayerViewRef, VlcPlayerViewProps>(
  (props, ref) => {
    const nativeProps = convertNativeProps(props);

    // @ts-expect-error
    if (nativeProps.children && !loggedRenderingChildrenWarning) {
      console.warn(
        "The <VLCPlayerView> component does not support children. This may lead to inconsistent behaviour or crashes. If you want to render content on top of the VLCPlayer, consider using absolute positioning.",
      );
      loggedRenderingChildrenWarning = true;
    }

    const onPaused = ({ nativeEvent }: { nativeEvent: Paused }) => {
      if (props.onPaused) {
        props.onPaused(nativeEvent);
      }
    };

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
        onPaused={onPaused}
        onWarn={onWarn}
        onError={onError}
        onPositionChanged={onPositionChanged}
        onLoad={onLoad}
      />
    );
  },
);

export default VlcPlayerView;
