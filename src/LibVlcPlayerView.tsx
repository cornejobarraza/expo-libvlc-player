import { requireNativeView } from "expo";
import { useState, type ComponentType } from "react";
import { View } from "react-native";

import {
  type LibVlcPlayerViewNativeProps,
  type LibVlcPlayerViewProps,
  type VideoAspectRatio,
} from "./LibVlcPlayerView.types";
import { convertAspectRatio } from "./utils/aspect";
import { parseNativeSource } from "./utils/assets";
import { convertNativeEvent } from "./utils/events";
import { useTimeoutRef } from "./utils/timeout";

const CHILDREN_WARNING =
  "<LibVlcPlayerView> does not support children. To render content, consider absolute positioning";
const RATIO_TIMEOUT = 300;

const NativeView: ComponentType<LibVlcPlayerViewNativeProps> =
  requireNativeView("ExpoLibVlcPlayer");

const LibVlcPlayerView = ({ ref, ...props }: LibVlcPlayerViewProps) => {
  const [warnedChildren, setWarnedChildren] = useState<boolean>(false);
  const [mediaRatio, setMediaRatio] = useState<VideoAspectRatio>(undefined);

  const setTimeoutRef = useTimeoutRef();

  if (props.children && !warnedChildren) {
    console.warn(CHILDREN_WARNING);
    setWarnedChildren(true);
  }

  const viewRatio =
    props.aspectRatio === "auto" ? (mediaRatio ?? props.fallbackRatio) : props.aspectRatio;

  return (
    <View style={[props.style, { aspectRatio: convertAspectRatio(viewRatio) }]}>
      <NativeView
        {...props}
        ref={ref}
        style={[props.style, { height: "100%" }]}
        source={parseNativeSource(props.source)}
        slaves={props.slaves?.map((slave) => ({
          ...slave,
          source: parseNativeSource(slave.source),
        }))}
        onBuffering={(event) => {
          props.onBuffering?.(convertNativeEvent(event));
        }}
        onEncounteredError={(event) => {
          props.onEncounteredError?.(convertNativeEvent(event));
        }}
        onDialogDisplay={(event) => {
          props.onDialogDisplay?.(convertNativeEvent(event));
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

          const { width, height } = mediaInfo.video;
          const videoRatio = width / height;

          const validRatio = videoRatio > 0 && videoRatio < Infinity;
          const nextRatio = validRatio ? videoRatio : undefined;

          // View resizing workaround
          const handler = () => setMediaRatio(nextRatio);
          setTimeoutRef(handler, RATIO_TIMEOUT);

          props.onFirstPlay?.(mediaInfo);
        }}
      />
    </View>
  );
};

export default LibVlcPlayerView;
