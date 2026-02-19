import { requireNativeView } from "expo";
import { forwardRef, type ComponentType } from "react";
import { View } from "react-native";

import {
  LibVlcPlayerViewNativeProps,
  LibVlcPlayerViewProps,
  LibVlcPlayerViewRef,
  type Dialog,
  type Error,
  type MediaInfo,
  type MediaTracks,
  type NativeEvent,
  type Position,
  type Recording,
  type Snapshot,
  type Time,
} from "./LibVlcPlayer.types";
import { convertAspectRatio } from "./utils/aspect";
import { parseSource } from "./utils/assets";
import { convertNativeEvent } from "./utils/events";

const NativeView: ComponentType<LibVlcPlayerViewNativeProps> =
  requireNativeView("ExpoLibVlcPlayer");

let loggedRenderingChildrenWarning: boolean = false;

const LibVlcPlayerView = forwardRef<LibVlcPlayerViewRef, LibVlcPlayerViewProps>(
  (props, ref) => {
    if (props.children && !loggedRenderingChildrenWarning) {
      console.warn(
        "The <LibVlcPlayerView> component does not support children. This may lead to inconsistent behaviour or crashes. If you want to render content on top of the LibVlcPlayer, consider using absolute positioning.",
      );
      loggedRenderingChildrenWarning = true;
    }

    const onEncounteredError = (event: NativeEvent<Error>) => {
      if (props.onEncounteredError) {
        const nativeEvent = convertNativeEvent(event);
        props.onEncounteredError(nativeEvent);
      }
    };

    const onDialogDisplay = (event: NativeEvent<Dialog>) => {
      if (props.onDialogDisplay) {
        const nativeEvent = convertNativeEvent(event);
        props.onDialogDisplay(nativeEvent);
      }
    };

    const onTimeChanged = (event: NativeEvent<Time>) => {
      if (props.onTimeChanged) {
        const nativeEvent = convertNativeEvent(event);
        props.onTimeChanged(nativeEvent);
      }
    };

    const onPositionChanged = (event: NativeEvent<Position>) => {
      if (props.onPositionChanged) {
        const nativeEvent = convertNativeEvent(event);
        props.onPositionChanged(nativeEvent);
      }
    };

    const onESAdded = (event: NativeEvent<MediaTracks>) => {
      if (props.onESAdded) {
        const nativeEvent = convertNativeEvent(event);
        props.onESAdded(nativeEvent);
      }
    };

    const onRecordChanged = (event: NativeEvent<Recording>) => {
      if (props.onRecordChanged) {
        const nativeEvent = convertNativeEvent(event);
        props.onRecordChanged(nativeEvent);
      }
    };

    const onSnapshotTaken = (event: NativeEvent<Snapshot>) => {
      if (props.onSnapshotTaken) {
        const nativeEvent = convertNativeEvent(event);
        props.onSnapshotTaken(nativeEvent);
      }
    };

    const onFirstPlay = (event: NativeEvent<MediaInfo>) => {
      if (props.onFirstPlay) {
        const nativeEvent = convertNativeEvent(event);
        props.onFirstPlay(nativeEvent);
      }
    };

    return (
      <View style={{ aspectRatio: convertAspectRatio(props.aspectRatio) }}>
        <NativeView
          {...props}
          ref={ref}
          style={[props.style, { height: "100%" }]}
          source={parseSource(props.source)}
          slaves={props.slaves?.map((slave) => ({
            ...slave,
            source: parseSource(slave.source)!,
          }))}
          onEncounteredError={onEncounteredError}
          onDialogDisplay={onDialogDisplay}
          onTimeChanged={onTimeChanged}
          onPositionChanged={onPositionChanged}
          onESAdded={onESAdded}
          onRecordChanged={onRecordChanged}
          onSnapshotTaken={onSnapshotTaken}
          onFirstPlay={onFirstPlay}
        />
      </View>
    );
  },
);

export default LibVlcPlayerView;
