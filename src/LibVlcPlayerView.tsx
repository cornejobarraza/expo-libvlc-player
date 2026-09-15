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

const NativeView: ComponentType<LibVlcPlayerViewNativeProps> =
  requireNativeView("ExpoLibVlcPlayer");

const CHILDREN_WARNING =
  "<LibVlcPlayerView> does not support children, which may lead to unexpected behaviour. To render content on top, consider absolute positioning";
const RATIO_DELAY = 300;

const LibVlcPlayerView = ({ ref, ...props }: LibVlcPlayerViewProps) => {
  const [warnedChildren, setWarnedChildren] = useState<boolean>(false);
  const [autoRatio, setAutoRatio] = useState<VideoAspectRatio>(props.fallbackRatio);

  const ratioTimeoutRef = useTimeoutRef();

  if (props.children && !warnedChildren) {
    console.warn(CHILDREN_WARNING);
    setWarnedChildren(true);
  }

  const viewRatio = props.aspectRatio === "auto" ? autoRatio : props.aspectRatio;

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
          const mediaRatio = mediaInfo.video.width / mediaInfo.video.height;

          const validRatio = mediaRatio > 0 && mediaRatio < Infinity;
          const nextRatio = validRatio ? mediaRatio : props.fallbackRatio;

          // View resizing workaround
          const ratioTimeout = setTimeout(() => setAutoRatio(nextRatio), RATIO_DELAY);
          ratioTimeoutRef.current = ratioTimeout;

          props.onFirstPlay?.(mediaInfo);
        }}
      />
    </View>
  );
};

export default LibVlcPlayerView;
