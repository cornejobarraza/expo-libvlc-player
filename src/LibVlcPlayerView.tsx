import { requireNativeView } from "expo";
import { useState, type ComponentType } from "react";
import { View } from "react-native";

import {
  type LibVlcPlayerViewNativeProps,
  type LibVlcPlayerViewProps,
  type VideoAspectRatio,
} from "./LibVlcPlayer.types";
import { convertAspectRatio } from "./utils/aspect";
import { parseNativeSource } from "./utils/assets";
import { convertNativeEvent } from "./utils/events";

const NativeView: ComponentType<LibVlcPlayerViewNativeProps> =
  requireNativeView("ExpoLibVlcPlayer");

const CHILDREN_WARNING =
  "The <LibVlcPlayerView> component does not support children. This may lead to inconsistent behaviour or crashes. If you want to render content on top of the LibVlcPlayer, consider using absolute positioning";

const RATIO_TIMEOUT = 250;

const LibVlcPlayerView = ({ ref, ...props }: LibVlcPlayerViewProps) => {
  const {
    fallbackRatio,
    children,
    aspectRatio,
    style,
    source,
    slaves,
    onBuffering,
    onStopped,
    onEncounteredError,
    onDialogDisplay,
    onTimeChanged,
    onPositionChanged,
    onESAdded,
    onRecordChanged,
    onSnapshotTaken,
    onFirstPlay,
  } = props;

  const [autoRatio, setAutoRatio] = useState<VideoAspectRatio>(fallbackRatio);
  const [warned, setWarned] = useState<boolean>(false);

  if (children && !warned) {
    console.warn(CHILDREN_WARNING);
    setWarned(true);
  }

  const viewRatio = aspectRatio === "auto" ? autoRatio : aspectRatio;

  return (
    <View style={[style, { aspectRatio: convertAspectRatio(viewRatio) }]}>
      <NativeView
        {...props}
        ref={ref}
        style={[style, { height: "100%" }]}
        source={parseNativeSource(source)}
        slaves={slaves?.map((slave) => ({
          ...slave,
          source: parseNativeSource(slave.source),
        }))}
        onBuffering={(event) => {
          onBuffering?.(convertNativeEvent(event));
        }}
        onStopped={(event) => {
          onStopped?.(convertNativeEvent(event));
        }}
        onEncounteredError={(event) => {
          onEncounteredError?.(convertNativeEvent(event));
        }}
        onDialogDisplay={(event) => {
          onDialogDisplay?.(convertNativeEvent(event));
        }}
        onTimeChanged={(event) => {
          onTimeChanged?.(convertNativeEvent(event));
        }}
        onPositionChanged={(event) => {
          onPositionChanged?.(convertNativeEvent(event));
        }}
        onESAdded={(event) => {
          onESAdded?.(convertNativeEvent(event));
        }}
        onRecordChanged={(event) => {
          onRecordChanged?.(convertNativeEvent(event));
        }}
        onSnapshotTaken={(event) => {
          onSnapshotTaken?.(convertNativeEvent(event));
        }}
        onFirstPlay={(event) => {
          const mediaInfo = convertNativeEvent(event);
          const mediaRatio = mediaInfo.width / mediaInfo.height;

          const validRatio = mediaRatio > 0 && mediaRatio < Infinity;
          const autoRatio = validRatio ? mediaRatio : fallbackRatio;

          // View resizing workaround
          setTimeout(() => setAutoRatio(autoRatio), RATIO_TIMEOUT);
          onFirstPlay?.(mediaInfo);
        }}
      />
    </View>
  );
};

export default LibVlcPlayerView;
