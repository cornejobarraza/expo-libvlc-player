import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Slider from "@react-native-community/slider";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import {
  LibVlcPlayerView,
  LibVlcPlayerViewRef,
  type LibVlcPlayerViewProps,
} from "expo-libvlc-player";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AlertButton,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PlayerControl } from "./PlayerControl";
import { useMediaThumbnail } from "../hooks/useMediaThumbnail";
import { usePortraitMode } from "../hooks/usePortraitMode";

const BIG_BUCK_BUNNY =
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const VLC_OPTIONS = ["--network-caching=1000"];

const THUMBNAIL_TIME = 27_000;
const BUFFERING_DELAY = 1_000;
const DEFAULT_LENGTH = 0;

const MIN_POSITION_VALUE = 0;
const MAX_POSITION_VALUE = 1;

const MIN_VOLUME_LEVEL = 0;
const MAX_VOLUME_LEVEL = 100;
const VOLUME_CHANGE_STEP = 10;

interface PlayerViewProps {
  floating?: boolean;
}

type VolumeChangeType = "increase" | "decrease";

function msToMinutesSeconds(length: number) {
  const totalSeconds = Math.floor(length / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export const PlayerView = ({ floating = false }: PlayerViewProps) => {
  const [position, setPosition] = useState<number>(MIN_POSITION_VALUE);
  const [length, setLength] = useState<number>(DEFAULT_LENGTH);
  const [seekable, setSeekable] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(MAX_VOLUME_LEVEL);
  const [mute, setMute] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<boolean>(false);

  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isBackgrounded, setIsBackgrounded] = useState<boolean>(false);

  const playerViewRef = useRef<LibVlcPlayerViewRef | null>(null);
  const bufferingTimeoutRef = useRef<number | null>(null);

  const media = { url: BIG_BUCK_BUNNY, time: THUMBNAIL_TIME };
  const thumbnail = useMediaThumbnail(media);
  const portrait = usePortraitMode();

  const playerEvents: Partial<LibVlcPlayerViewProps> = {
    onBuffering: () => {
      setIsBuffering(true);

      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
      }

      bufferingTimeoutRef.current = setTimeout(
        () => setIsBuffering(false),
        BUFFERING_DELAY,
      );
    },
    onPlaying: () => {
      activateKeepAwakeAsync();
      setIsBuffering(false);
      setIsPlaying(true);
      setIsStopped(false);
    },
    onPaused: () => {
      deactivateKeepAwake();
      setIsBuffering(false);
      setIsPlaying(false);
      setIsStopped(false);
    },
    onStopped: () => {
      deactivateKeepAwake();
      setPosition(MIN_POSITION_VALUE);
      setIsBuffering(false);
      setIsPlaying(false);
      setIsStopped(true);
    },
    onEncounteredError: ({ error }) => {
      Alert.alert("Something went wrong", error);

      const message = error.toLowerCase();
      const hasToReset =
        message.includes("player") || message.includes("media");

      if (hasToReset) {
        handleErrorState();
      }
    },
    onPositionChanged: ({ position }) => {
      setPosition(position);
      setIsBuffering(false);
    },
    onDialogDisplay: ({
      title,
      text,
      action1Text,
      action2Text,
      cancelText,
    }) => {
      const alertButtons: AlertButton[] = [
        {
          text: action1Text,
          onPress: () => playerViewRef.current?.postAction(1),
        },
        {
          text: action2Text,
          onPress: () => playerViewRef.current?.postAction(2),
        },
        {
          text: cancelText,
          onPress: () => playerViewRef.current?.dismiss(),
          style: "cancel",
        },
      ];

      const visibleButtons = alertButtons.filter((button) => button.text);

      Alert.alert(title, text, visibleButtons);
    },
    onFirstPlay: ({ length, seekable }) => {
      setLength(length);
      setSeekable(seekable);
    },
    onBackground: () => {
      setIsBackgrounded(true);
    },
  };

  const handleSlidingComplete = (position: number) => {
    playerViewRef.current?.seek(position);
    setPosition(position);
    setIsBackgrounded(false);
  };

  const handlePlayPause = () => {
    playerViewRef.current?.[!isPlaying ? "play" : "pause"]();
    setIsBackgrounded(false);
    setIsError(false);
  };

  const handleStopPlayer = () => {
    playerViewRef.current?.stop();
    setIsBackgrounded(false);
  };

  const handleRepeatChange = () => setRepeat((prev) => !prev);

  const handleVolumeChange = (type: VolumeChangeType) => {
    const newVolume =
      type === "increase"
        ? volume + VOLUME_CHANGE_STEP
        : volume - VOLUME_CHANGE_STEP;

    const hasValidVolume =
      newVolume >= MIN_VOLUME_LEVEL && newVolume <= MAX_VOLUME_LEVEL;

    if (!hasValidVolume) return;

    setVolume(newVolume);
  };

  const handleMute = () => setMute((prev) => !prev);

  const handleErrorState = () => {
    deactivateKeepAwake();
    setPosition(MIN_POSITION_VALUE);
    setLength(DEFAULT_LENGTH);
    setSeekable(false);
    setIsBuffering(false);
    setIsPlaying(false);
    setIsStopped(false);
    setIsError(true);
    setIsBackgrounded(false);
  };

  const shouldShowThumbnail =
    !!thumbnail &&
    !isPlaying &&
    (position === MIN_POSITION_VALUE || isStopped || isBackgrounded);

  return (
    <View
      style={{
        ...styles.player,
        flexDirection: portrait ? "column" : "row",
        borderWidth: floating ? 1 : 0,
      }}
    >
      <View style={styles.video}>
        {isBuffering && (
          <ActivityIndicator
            style={{ ...StyleSheet.absoluteFillObject, zIndex: 20 }}
            color="white"
            size="large"
          />
        )}
        {shouldShowThumbnail && (
          <Image
            style={{
              ...StyleSheet.absoluteFillObject,
              width: "100%",
              height: "100%",
              zIndex: 10,
            }}
            source={{ uri: thumbnail }}
          />
        )}
        <LibVlcPlayerView
          ref={playerViewRef}
          style={{ height: "100%" }}
          source={!isError ? media.url : null}
          options={VLC_OPTIONS}
          volume={volume}
          mute={mute}
          repeat={repeat}
          {...playerEvents}
        />
      </View>
      <View style={styles.controls}>
        <View style={styles.length}>
          <Text>{msToMinutesSeconds(position * length)}</Text>
          <Text>
            {length > DEFAULT_LENGTH ? msToMinutesSeconds(length) : "N/A"}
          </Text>
        </View>
        <Slider
          value={position}
          onSlidingComplete={handleSlidingComplete}
          minimumValue={MIN_POSITION_VALUE}
          maximumValue={MAX_POSITION_VALUE}
          thumbTintColor="darkred"
          minimumTrackTintColor="red"
          maximumTrackTintColor="lightgray"
          disabled={!seekable}
          tapToSeek
        />
        <View style={styles.buttons}>
          <PlayerControl
            icon={!isPlaying ? "play" : "pause"}
            onPress={handlePlayPause}
          />
          <PlayerControl
            icon="stop"
            onPress={handleStopPlayer}
            disabled={isStopped}
          />
          <PlayerControl
            icon="redo"
            onPress={handleRepeatChange}
            disabled={length <= DEFAULT_LENGTH}
            selected={repeat}
          />
        </View>
        <View style={styles.buttons}>
          <PlayerControl
            icon="volume-down"
            size={18}
            onPress={() => handleVolumeChange("decrease")}
            disabled={volume === MIN_VOLUME_LEVEL}
          />
          <PlayerControl
            icon="volume-mute"
            size={18}
            onPress={handleMute}
            selected={mute}
          />
          <PlayerControl
            icon="volume-up"
            size={18}
            onPress={() => handleVolumeChange("increase")}
            disabled={volume === MAX_VOLUME_LEVEL}
          />
        </View>
        {floating && (
          <View style={styles.toolbar}>
            <FontAwesome5
              name="grip-lines"
              size={16}
              color="rgba(0, 0, 0, 0.75)"
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  player: {
    width: "75%",
    borderColor: "gray",
    borderRadius: 8,
    overflow: "hidden",
  },
  video: {
    position: "relative",
    backgroundColor: "black",
    aspectRatio: 16 / 9,
  },
  controls: {
    backgroundColor: "white",
    flexShrink: 1,
    gap: 24,
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  length: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  buttons: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  toolbar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: -16,
  },
});
