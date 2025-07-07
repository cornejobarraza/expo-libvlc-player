import { requireNativeView } from "expo";
import { forwardRef, type ComponentType } from "react";

import {
  VlcPlayerViewNativeProps,
  VlcPlayerViewProps,
  VLCPlayerViewRef,
  type Warn,
  type Error,
  type PositionChanged,
  type VideoInfo,
  type Background,
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

    const onBackground = ({ nativeEvent }: { nativeEvent: Background }) => {
      if (props.onBackground) {
        props.onBackground(nativeEvent);
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
        onBackground={onBackground}
      />
    );
  },
);

export default VlcPlayerView;
