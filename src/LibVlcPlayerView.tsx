import { requireNativeView } from "expo";
import { type ComponentType, useState } from "react";
import { View } from "react-native";

import {
  type LibVlcPlayerViewNativeProps,
  type LibVlcPlayerViewProps,
  type MediaInfo,
  type VideoAspectRatio,
} from "./LibVlcPlayerView.types";
import { convertAspectRatio } from "./utils/aspect";
import { forwardNativeEvent } from "./utils/events";
import { convertPlayerProps } from "./utils/props";
import { usePlayerRef } from "./utils/ref";
import { parseNativeProps } from "./utils/sources";

const CHILDREN_WARNING =
  "<LibVlcPlayerView> does not support children. Render content using absolute positioning";

const NativeView: ComponentType<LibVlcPlayerViewNativeProps> =
  requireNativeView("ExpoLibVlcPlayer");

const LibVlcPlayerView = ({ ref, ...props }: LibVlcPlayerViewProps) => {
  const [warnedChildren, setWarnedChildren] = useState<boolean>(false);
  const [mediaRatio, setMediaRatio] = useState<VideoAspectRatio>(undefined);

  const nativeProps = parseNativeProps(convertPlayerProps(props));
  const nativeRef = usePlayerRef(ref, nativeProps);

  const handleFirstPlay = (mediaInfo: MediaInfo) => {
    const videoRatio = mediaInfo.video.width / mediaInfo.video.height;
    const validRatio = videoRatio > 0 && videoRatio < Infinity;
    setMediaRatio(validRatio ? videoRatio : undefined);
    props.onFirstPlay?.(mediaInfo);
  };

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
        {...nativeProps}
        ref={nativeRef}
        style={[props.style, { height: "100%" }]}
        onBuffering={forwardNativeEvent(props.onBuffering)}
        onEncounteredError={forwardNativeEvent(props.onEncounteredError)}
        onDialogDisplay={forwardNativeEvent(props.onDialogDisplay)}
        onDialogProgress={forwardNativeEvent(props.onDialogProgress)}
        onTimeChanged={forwardNativeEvent(props.onTimeChanged)}
        onPositionChanged={forwardNativeEvent(props.onPositionChanged)}
        onESAdded={forwardNativeEvent(props.onESAdded)}
        onRecordChanged={forwardNativeEvent(props.onRecordChanged)}
        onSnapshotTaken={forwardNativeEvent(props.onSnapshotTaken)}
        onFirstPlay={forwardNativeEvent(handleFirstPlay)}
      />
    </View>
  );
};

export default LibVlcPlayerView;
