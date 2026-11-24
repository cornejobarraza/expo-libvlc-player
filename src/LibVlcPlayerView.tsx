import { requireNativeView } from "expo";
import { type ComponentType, useState } from "react";
import { View } from "react-native";

import {
  type LibVlcPlayerViewNativeProps,
  type LibVlcPlayerViewProps,
  type VideoAspectRatio,
} from "./LibVlcPlayerView.types";
import { convertAspectRatio, getMediaRatio } from "./utils/aspect";
import { parseNativeMetadata, parseNativeSlaves, parseNativeSource } from "./utils/assets";
import { convertNativeEvent } from "./utils/events";
import { usePlayerRef } from "./utils/ref";
import { useTimeoutRef } from "./utils/timeout";

const CHILDREN_WARNING =
  "<LibVlcPlayerView> does not support children. Render content using absolute positioning";

const NativeView: ComponentType<LibVlcPlayerViewNativeProps> =
  requireNativeView("ExpoLibVlcPlayer");

const LibVlcPlayerView = ({ ref, ...props }: LibVlcPlayerViewProps) => {
  const [warnedChildren, setWarnedChildren] = useState<boolean>(false);
  const [mediaRatio, setMediaRatio] = useState<VideoAspectRatio>(undefined);

  const nativeRef = usePlayerRef(ref, props);
  const timeoutRef = useTimeoutRef();

  const viewRatio =
    props.aspectRatio === "auto" ? (mediaRatio ?? props.fallbackRatio) : props.aspectRatio;

  if (props.children && !warnedChildren) {
    console.warn(CHILDREN_WARNING);
    setWarnedChildren(true);
  }

  return (
    <View style={[props.style, { aspectRatio: convertAspectRatio(viewRatio) }]}>
      <NativeView
        {...props}
        ref={nativeRef}
        style={[props.style, { height: "100%" }]}
        source={parseNativeSource(props.source)}
        metadata={parseNativeMetadata(props.metadata)}
        slaves={parseNativeSlaves(props.slaves)}
        onBuffering={(event) => {
          props.onBuffering?.(convertNativeEvent(event));
        }}
        onEncounteredError={(event) => {
          props.onEncounteredError?.(convertNativeEvent(event));
        }}
        onDialogDisplay={(event) => {
          props.onDialogDisplay?.(convertNativeEvent(event));
        }}
        onDialogProgress={(event) => {
          props.onDialogProgress?.(convertNativeEvent(event));
        }}
        onTimeChanged={(event) => {
          props.onTimeChanged?.(convertNativeEvent(event));
        }}
        onPositionChanged={(event) => {
          props.onPositionChanged?.(convertNativeEvent(event));
        }}
        onESAdded={(event) => {
          props.onESAdded?.(convertNativeEvent(event));
        }}
        onRecordChanged={(event) => {
          props.onRecordChanged?.(convertNativeEvent(event));
        }}
        onSnapshotTaken={(event) => {
          props.onSnapshotTaken?.(convertNativeEvent(event));
        }}
        onFirstPlay={(event) => {
          const mediaInfo = convertNativeEvent(event);
          const mediaRatio = getMediaRatio(mediaInfo.video);
          timeoutRef(() => setMediaRatio(mediaRatio)); // View resize workaround
          props.onFirstPlay?.(mediaInfo);
        }}
      />
    </View>
  );
};

export default LibVlcPlayerView;
