import { requireNativeView } from "expo";
import { forwardRef, useRef, type ComponentType } from "react";
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
    const aspectRatio = useRef<number | undefined>(undefined);

    if (props.children && !loggedRenderingChildrenWarning) {
      console.warn(
        "The <LibVlcPlayerView> component does not support children. This may lead to inconsistent behaviour or crashes. If you want to render content on top of the LibVlcPlayer, consider using absolute positioning.",
      );
      loggedRenderingChildrenWarning = true;
    }

    const onEncounteredError = (event: NativeEvent<Error>) => {
      const nativeEvent = convertNativeEvent(event);

      if (props.onEncounteredError) {
        props.onEncounteredError(nativeEvent);
      }
    };

    const onDialogDisplay = (event: NativeEvent<Dialog>) => {
      const nativeEvent = convertNativeEvent(event);

      if (props.onDialogDisplay) {
        props.onDialogDisplay(nativeEvent);
      }
    };

    const onTimeChanged = (event: NativeEvent<Time>) => {
      const nativeEvent = convertNativeEvent(event);

      if (props.onTimeChanged) {
        props.onTimeChanged(nativeEvent);
      }
    };

    const onPositionChanged = (event: NativeEvent<Position>) => {
      const nativeEvent = convertNativeEvent(event);

      if (props.onPositionChanged) {
        props.onPositionChanged(nativeEvent);
      }
    };

    const onESAdded = (event: NativeEvent<MediaTracks>) => {
      const nativeEvent = convertNativeEvent(event);

      if (props.onESAdded) {
        props.onESAdded(nativeEvent);
      }
    };

    const onRecordChanged = (event: NativeEvent<Recording>) => {
      const nativeEvent = convertNativeEvent(event);

      if (props.onRecordChanged) {
        props.onRecordChanged(nativeEvent);
      }
    };

    const onSnapshotTaken = (event: NativeEvent<Snapshot>) => {
      const nativeEvent = convertNativeEvent(event);

      if (props.onSnapshotTaken) {
        props.onSnapshotTaken(nativeEvent);
      }
    };

    const onFirstPlay = (event: NativeEvent<MediaInfo>) => {
      const nativeEvent = convertNativeEvent(event);

      if (props.onFirstPlay) {
        props.onFirstPlay(nativeEvent);
      }

      aspectRatio.current = nativeEvent.width / nativeEvent.height || undefined;
    };

    const nilRatio = props.aspectRatio || aspectRatio.current;
    const nativeRatio = convertAspectRatio(nilRatio);

    return (
      <View style={{ aspectRatio: nativeRatio }}>
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
