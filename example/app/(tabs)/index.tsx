import Slider from "@react-native-community/slider";
import {
  LibVlcPlayerView,
  LibVlcPlayerViewRef,
  type LibVlcSource,
  type Error,
  type Position,
  type MediaInfo,
} from "expo-libvlc-player";
import { unlockAsync } from "expo-screen-orientation";
import { getThumbnailAsync } from "expo-video-thumbnails";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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

const MIN_POSITION_VALUE = 0;
const MAX_POSITION_VALUE = 1;

const MIN_VOLUME_LEVEL = 0;
const MAX_VOLUME_LEVEL = 100;
const VOLUME_CHANGE_STEP = 10;

type VolumeChange = "increase" | "decrease";
type RepeatMode = boolean | "once";

export default function HomeTab() {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(MAX_VOLUME_LEVEL);
  const [muted, setMuted] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<RepeatMode>(false);

  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBackgrounded, setIsBackgrounded] = useState<boolean>(false);
  const [isSeekable, setIsSeekable] = useState<boolean>(false);

  const playerViewRef = useRef<LibVlcPlayerViewRef | null>(null);
  const bufferingTimeoutRef = useRef<number | null>(null);

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

  const resetPlayerState = () => {
    setPosition(0);
    setDuration(0);
    setIsBuffering(false);
    setIsPlaying(false);
    setIsBackgrounded(false);
    setIsSeekable(false);
  };

  const handlePlayerEvents = {
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
    },
    onPaused: () => {
      setIsBuffering(false);
      setIsPlaying(false);
    },
    onStopped: () => {
      setPosition(0);
      setRepeat((prev) => (prev !== "once" ? prev : false));
      setIsBuffering(false);
      setIsPlaying(false);
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

  const handleRepeatChange = () =>
    setRepeat((prev) => (!prev ? "once" : prev === "once"));

  const handleVolumeChange = (type: VolumeChange) => {
    const newVolume =
      type === "increase"
        ? volume + VOLUME_CHANGE_STEP
        : volume - VOLUME_CHANGE_STEP;

    const hasValidVolume =
      newVolume >= MIN_VOLUME_LEVEL && newVolume <= MAX_VOLUME_LEVEL;

    if (!hasValidVolume) return;

    setVolume(newVolume);
  };

  const handleMute = () => setMuted((prev) => !prev);

  const shouldShowLoader = isBuffering && !isBackgrounded;

  const shouldShowThumbnail =
    !!thumbnail &&
    !isPlaying &&
    (position === MIN_POSITION_VALUE || isBackgrounded);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView overScrollMode="never" bounces={false}>
        <View style={styles.group}>
          <View
            style={{
              backgroundColor: "black",
              position: "relative",
              borderRadius: 6,
              aspectRatio: 16 / 9,
            }}
          >
            {shouldShowLoader && (
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
                  borderRadius: 6,
                  zIndex: 10,
                }}
                source={{ uri: thumbnail }}
              />
            )}
            <LibVlcPlayerView
              ref={playerViewRef}
              style={{ height: "100%", borderRadius: 6 }}
              source={BIG_BUCK_BUNNY}
              options={VLC_OPTIONS}
              volume={volume}
              mute={muted}
              repeat={repeat !== false}
              {...handlePlayerEvents}
            />
          </View>
          <View style={styles.duration}>
            <Text>{msToMinutesSeconds(position * duration)}</Text>
            <Text>{duration > 0 ? msToMinutesSeconds(duration) : "N/A"}</Text>
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
          />
          <View style={styles.row}>
            <Button
              title={!isPlaying ? "Play" : "Pause"}
              onPress={handlePlayPause}
            />
            <Button title="Stop" onPress={handleStopPlayer} />
            <Button
              title={
                !repeat
                  ? "Don't repeat"
                  : repeat === "once"
                    ? "Repeat once"
                    : "Repeat"
              }
              onPress={handleRepeatChange}
              disabled={duration <= 0}
            />
          </View>
          <View style={styles.row}>
            <Button
              title="-"
              onPress={() => handleVolumeChange("decrease")}
              disabled={volume === MIN_VOLUME_LEVEL || muted}
            />
            <Button
              title={!muted ? "Mute" : "Unmute"}
              onPress={handleMute}
              disabled={volume === MIN_VOLUME_LEVEL && !muted}
            />
            <Button
              title="+"
              onPress={() => handleVolumeChange("increase")}
              disabled={volume === MAX_VOLUME_LEVEL || muted}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#eee",
  },
  group: {
    backgroundColor: "#fff",
    gap: 24,
    padding: 24,
  },
  duration: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
});
