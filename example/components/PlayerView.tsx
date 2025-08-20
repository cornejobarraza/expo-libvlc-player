import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Slider from "@react-native-community/slider";
import {
  LibVlcPlayerView,
  LibVlcPlayerViewRef,
  type Error,
  type MediaInfo,
  type Position,
} from "expo-libvlc-player";
import {
  addOrientationChangeListener,
  Orientation,
  OrientationChangeEvent,
  unlockAsync,
} from "expo-screen-orientation";
import { getThumbnailAsync } from "expo-video-thumbnails";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function msToMinutesSeconds(duration: number) {
  const totalSeconds = Math.floor(duration / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

const BIG_BUCK_BUNNY =
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const VLC_OPTIONS = ["--network-caching=1000"];

const THUMBNAIL_TIME = 27_000;
const BUFFERING_DELAY = 1_000;
const DEFAULT_DURATION = 0;

const MIN_POSITION_VALUE = 0;
const MAX_POSITION_VALUE = 1;

const MIN_VOLUME_LEVEL = 0;
const MAX_VOLUME_LEVEL = 100;
const VOLUME_CHANGE_STEP = 10;

type VolumeChangeType = "increase" | "decrease";

interface PlayerViewProps {
  floating?: boolean;
}

export const PlayerView = ({ floating = true }: PlayerViewProps) => {
  const [orientation, setOrientation] = useState<Orientation>(
    Orientation.UNKNOWN,
  );
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [position, setPosition] = useState<number>(MIN_POSITION_VALUE);
  const [duration, setDuration] = useState<number>(DEFAULT_DURATION);
  const [volume, setVolume] = useState<number>(MAX_VOLUME_LEVEL);
  const [mute, setMute] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<boolean>(false);

  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const [isBackgrounded, setIsBackgrounded] = useState<boolean>(false);
  const [isSeekable, setIsSeekable] = useState<boolean>(false);

  const playerViewRef = useRef<LibVlcPlayerViewRef | null>(null);
  const bufferingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const listener = ({
      orientationInfo: { orientation },
    }: OrientationChangeEvent) => setOrientation(orientation);
    const subscription = addOrientationChangeListener(listener);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    unlockOrientation();
  }, []);

  useEffect(() => {
    generateThumbnail();
  }, []);

  const unlockOrientation = async () => await unlockAsync();

  const generateThumbnail = async () => {
    try {
      const { uri } = await getThumbnailAsync(BIG_BUCK_BUNNY, {
        time: THUMBNAIL_TIME,
      });

      setThumbnail(uri);
    } catch {
      setThumbnail(null);
    }
  };

  const playerEvents = {
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
      setIsBuffering(false);
      setIsPlaying(true);
      setIsStopped(false);
    },
    onPaused: () => {
      setIsBuffering(false);
      setIsPlaying(false);
      setIsStopped(false);
    },
    onStopped: () => {
      setPosition(MIN_POSITION_VALUE);
      setIsBuffering(false);
      setIsPlaying(false);
      setIsStopped(true);
    },
    onEncounteredError: ({ error }: Error) => {
      Alert.alert("An error occurred", error);

      const message = error.toLowerCase();
      const hasToReset =
        message.includes("player") || message.includes("media");

      if (hasToReset) {
        resetPlayerState();
      }
    },
    onPositionChanged: ({ position }: Position) => {
      setPosition(position);
      setIsBuffering(false);
    },
    onFirstPlay: ({ duration, seekable }: MediaInfo) => {
      setDuration(duration);
      setIsSeekable(seekable);
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

  const resetPlayerState = () => {
    setPosition(MIN_POSITION_VALUE);
    setDuration(DEFAULT_DURATION);
    setIsBuffering(false);
    setIsPlaying(false);
    setIsStopped(false);
    setIsBackgrounded(false);
    setIsSeekable(false);
  };

  const isPortrait =
    orientation !== Orientation.LANDSCAPE_LEFT &&
    orientation !== Orientation.LANDSCAPE_RIGHT;

  const shouldShowThumbnail =
    !!thumbnail &&
    !isPlaying &&
    (position === MIN_POSITION_VALUE || isStopped || isBackgrounded);

  return (
    <View
      style={{
        ...styles.player,
        flexDirection: isPortrait ? "column" : "row",
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
          source={BIG_BUCK_BUNNY}
          options={VLC_OPTIONS}
          volume={volume}
          mute={mute}
          repeat={repeat}
          {...playerEvents}
        />
      </View>
      <View style={styles.controls}>
        <View style={styles.duration}>
          <Text>{msToMinutesSeconds(position * duration)}</Text>
          <Text>
            {duration > DEFAULT_DURATION ? msToMinutesSeconds(duration) : "N/A"}
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
          disabled={!isSeekable}
          tapToSeek
        />
        <View style={styles.buttons}>
          <Control
            name={!isPlaying ? "play" : "pause"}
            onPress={handlePlayPause}
          />
          <Control
            name="stop"
            onPress={handleStopPlayer}
            disabled={isStopped}
          />
          <Control
            name="redo"
            onPress={handleRepeatChange}
            disabled={duration <= DEFAULT_DURATION}
            selected={repeat}
          />
        </View>
        <View style={styles.buttons}>
          <Control
            name="volume-down"
            size={18}
            onPress={() => handleVolumeChange("decrease")}
            disabled={volume === MIN_VOLUME_LEVEL}
          />
          <Control
            name="volume-mute"
            size={18}
            onPress={handleMute}
            selected={mute}
          />
          <Control
            name="volume-up"
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

interface ControlButtonProps {
  name: string;
  size?: number;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
}

const Control = ({
  name,
  size = 16,
  onPress,
  disabled,
  selected = false,
}: ControlButtonProps) => {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: !disabled ? (!selected ? "black" : "darkred") : "gray",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
      }}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      <FontAwesome5 name={name} color="white" size={size} />
    </TouchableOpacity>
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
  duration: {
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
