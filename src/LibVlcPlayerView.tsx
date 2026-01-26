import { requireNativeView } from "expo";
import { forwardRef, type ComponentType } from "react";

import {
  LibVlcPlayerViewNativeProps,
  LibVlcPlayerViewProps,
  LibVlcPlayerViewRef,
  type NativeEvent,
  type Error,
  type Time,
  type Position,
  type MediaTracks,
  type MediaInfo,
  type Dialog,
  type Recording,
} from "./LibVlcPlayer.types";
import { parseSource } from "./utils/assets";
import { converNativeEvent } from "./utils/events";
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

    const onEncounteredError = (event: NativeEvent<Error>) => {
      if (props.onEncounteredError) {
        const nativeEvent = converNativeEvent(event);

        props.onEncounteredError(nativeEvent);
      }
    };

    const onTimeChanged = (event: NativeEvent<Time>) => {
      if (props.onTimeChanged) {
        const nativeEvent = converNativeEvent(event);

        props.onTimeChanged(nativeEvent);
      }
    };

    const onPositionChanged = (event: NativeEvent<Position>) => {
      if (props.onPositionChanged) {
        const nativeEvent = converNativeEvent(event);

        props.onPositionChanged(nativeEvent);
      }
    };

    const onESAdded = (event: NativeEvent<MediaTracks>) => {
      if (props.onESAdded) {
        const nativeEvent = converNativeEvent(event);

        props.onESAdded(nativeEvent);
      }
    };

    const onRecordChanged = (event: NativeEvent<Recording>) => {
      if (props.onRecordChanged) {
        const nativeEvent = converNativeEvent(event);

        props.onRecordChanged(nativeEvent);
      }
    };

    const onDialogDisplay = (event: NativeEvent<Dialog>) => {
      if (props.onDialogDisplay) {
        const nativeEvent = converNativeEvent(event);

        props.onDialogDisplay(nativeEvent);
      }
    };

    const onFirstPlay = (event: NativeEvent<MediaInfo>) => {
      if (props.onFirstPlay) {
        const nativeEvent = converNativeEvent(event);

        props.onFirstPlay(nativeEvent);
      }
    };

    return (
      <NativeView
        {...nativeProps}
        ref={ref}
        source={parseSource(props.source)}
        slaves={props.slaves?.map((slave) => ({
          ...slave,
          source: parseSource(slave.source)!,
        }))}
        onEncounteredError={onEncounteredError}
        onTimeChanged={onTimeChanged}
        onPositionChanged={onPositionChanged}
        onESAdded={onESAdded}
        onRecordChanged={onRecordChanged}
        onDialogDisplay={onDialogDisplay}
        onFirstPlay={onFirstPlay}
      />
    );
  },
);

export default LibVlcPlayerView;
