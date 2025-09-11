import { requireNativeView } from "expo";
import { forwardRef, type ComponentType } from "react";

import {
  LibVlcPlayerViewNativeProps,
  LibVlcPlayerViewProps,
  LibVlcPlayerViewRef,
  type NativeEvent,
  type Error,
  type Position,
  type MediaTracks,
  type QuestionDialog,
  type MediaInfo,
} from "./LibVlcPlayer.types";
import { parseSource } from "./utils/assets";
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

    const onEncounteredError = ({ nativeEvent }: NativeEvent<Error>) => {
      if (props.onEncounteredError) {
        props.onEncounteredError(nativeEvent);
      }
    };

    const onPositionChanged = ({ nativeEvent }: NativeEvent<Position>) => {
      if (props.onPositionChanged) {
        props.onPositionChanged(nativeEvent);
      }
    };

    const onESAdded = ({ nativeEvent }: NativeEvent<MediaTracks>) => {
      if (props.onESAdded) {
        props.onESAdded(nativeEvent);
      }
    };

    const onDialogDisplay = ({ nativeEvent }: NativeEvent<QuestionDialog>) => {
      if (props.onDialogDisplay) {
        props.onDialogDisplay(nativeEvent);
      }
    };

    const onFirstPlay = ({ nativeEvent }: NativeEvent<MediaInfo>) => {
      if (props.onFirstPlay) {
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
        onPositionChanged={onPositionChanged}
        onESAdded={onESAdded}
        onDialogDisplay={onDialogDisplay}
        onFirstPlay={onFirstPlay}
      />
    );
  },
);

export default LibVlcPlayerView;
