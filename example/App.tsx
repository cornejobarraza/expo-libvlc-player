import Slider from "@react-native-community/slider";
import {
  LibVlcPlayerView,
  LibVlcPlayerViewRef,
  type Error,
  type PositionChanged,
  type VideoInfo,
  type Background,
} from "expo-libvlc-player";
import { getThumbnailAsync } from "expo-video-thumbnails";
import { ReactNode, useEffect, useRef, useState } from "react";
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
  useWindowDimensions,
} from "react-native";

function msToMinutesSeconds(duration: number) {
  const totalSeconds = Math.floor(duration / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedSeconds = seconds.toString().padStart(2, "0");

  return `${minutes}:${formattedSeconds}`;
}

const BUFFERING_DELAY = 1_000;
const VLC_OPTIONS = ["--network-caching=1000"];
const ASPECT_RATIO = 16 / 9;

const PRIMARY_PLAYER_URI =
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SECONDARY_PLAYER_URI =
  "http://streams.videolan.org/streams/mp4/Mr_MrsSmith-h264_aac.mp4";

const PRIMARY_THUMBNAIL_POSITION = 27_000;
const SECONDARY_THUMBNAIL_POSITION = 77_000;

const MIN_POSITION_VALUE = 0;
const MAX_POSITION_VALUE = 1;

const MIN_VOLUME_LEVEL = 0;
const MAX_VOLUME_LEVEL = 100;
const VOLUME_CHANGE_STEP = 10;

type VolumeChangeType = "increase" | "decrease";
type RepeatMode = boolean | "once";

export default function App() {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [uri, setUri] = useState<string>(PRIMARY_PLAYER_URI);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(MAX_VOLUME_LEVEL);
  const [muted, setMuted] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<RepeatMode>(false);

  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBackgrounded, setIsBackgrounded] = useState<boolean>(false);
  const [isSeekable, setIsSeekable] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean | null>(null);

  const playerViewRef = useRef<LibVlcPlayerViewRef | null>(null);
  const bufferingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { width } = useWindowDimensions();
  const videoWidth = width * 0.8;
  const videoHeight = videoWidth / ASPECT_RATIO;

  useEffect(() => {
    generateThumbnail();
  }, [uri]);

  const generateThumbnail = async () => {
    try {
      const { uri: url } = await getThumbnailAsync(uri, {
        time:
          uri === PRIMARY_PLAYER_URI
            ? PRIMARY_THUMBNAIL_POSITION
            : SECONDARY_THUMBNAIL_POSITION,
      });
      setThumbnail(url);
    } catch {
      setThumbnail(null);
    }
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
      setIsBackgrounded(false);
      setIsBuffering(false);
      setIsPlaying(true);
    },
    onPaused: () => {
      setIsBuffering(false);
      setIsPlaying(false);
    },
    onStopped: () => {
      setIsBackgrounded(false);
      setIsBuffering(false);
      setIsPlaying(false);
    },
    onRepeat: () => {
      setRepeat((prev) => (prev !== "once" ? prev : false));
    },
    onError: ({ error }: Error) => {
      Alert.alert("Error", error);
      setIsBuffering(false);
      setIsPlaying(false);
      setIsBackgrounded(false);
      setIsSeekable(false);
      setHasLoaded(false);
    },
    onPositionChanged: ({ position }: PositionChanged) => {
      setIsBuffering(false);
      setPosition(position);
    },
    onLoad: ({ duration, seekable }: VideoInfo) => {
      setDuration(duration);
      setIsSeekable(seekable);
      setHasLoaded(true);
    },
    onBackground: ({ background }: Background) => {
      if (isPlaying) {
        setIsBackgrounded(background);
      } else {
        setIsBackgrounded(true);
      }
    },
  };

  const handleSlidingComplete = (position: number) =>
    playerViewRef.current?.seek(position);

  const handlePlayPause = () => {
    if (!isPlaying) {
      playerViewRef.current?.play();
    } else {
      playerViewRef.current?.pause();
    }
  };

  const handleStopPlayer = () => playerViewRef.current?.stop();

  const handleRepeatChange = () =>
    setRepeat((prev) => (!prev ? "once" : prev === "once"));

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

  const handleMute = () => setMuted((prev) => !prev);

  const shouldShowLoader =
    (hasLoaded === null || isBuffering) && !isBackgrounded;

  const shouldShowThumbnail =
    !!thumbnail &&
    !isPlaying &&
    (position === MIN_POSITION_VALUE || isBackgrounded);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Example App</Text>
        <Group name="View">
          <View
            style={{
              backgroundColor: "black",
              position: "relative",
              height: videoHeight,
              borderRadius: 5,
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
                  width: "100%",
                  height: "100%",
                  ...StyleSheet.absoluteFillObject,
                  borderRadius: 5,
                  zIndex: 10,
                }}
                source={{ uri: thumbnail }}
              />
            )}
            <LibVlcPlayerView
              ref={playerViewRef}
              style={{ height: "100%", borderRadius: 5 }}
              uri={uri}
              options={VLC_OPTIONS}
              volume={volume}
              mute={muted}
              repeat={repeat !== false}
              {...handlePlayerEvents}
            />
          </View>
          <Button
            title="Change media"
            onPress={() =>
              setUri((prev) =>
                prev !== PRIMARY_PLAYER_URI
                  ? PRIMARY_PLAYER_URI
                  : SECONDARY_PLAYER_URI,
              )
            }
          />
        </Group>
        <Group name="Controls">
          <View style={styles.duration}>
            <Text>{msToMinutesSeconds(position * duration)}</Text>
            <Text>{msToMinutesSeconds(duration)}</Text>
          </View>
          <Slider
            value={position}
            onSlidingComplete={handleSlidingComplete}
            minimumValue={MIN_POSITION_VALUE}
            maximumValue={MAX_POSITION_VALUE}
            thumbTintColor="darkred"
            minimumTrackTintColor="red"
            maximumTrackTintColor="indianred"
            disabled={!isSeekable || hasLoaded === null}
          />
          <View style={styles.row}>
            <Button
              title={!isPlaying ? "Play" : "Pause"}
              onPress={handlePlayPause}
              disabled={hasLoaded === null}
            />
            <Button
              title="Stop"
              onPress={handleStopPlayer}
              disabled={hasLoaded === null}
            />
            <Button
              title={
                !repeat
                  ? "Don't repeat"
                  : repeat === "once"
                    ? "Repeat once"
                    : "Repeat"
              }
              onPress={handleRepeatChange}
              disabled={duration <= 0 || hasLoaded === null}
            />
          </View>
          <View style={styles.row}>
            <Button
              title="-"
              onPress={() => handleVolumeChange("decrease")}
              disabled={
                volume === MIN_VOLUME_LEVEL || muted || hasLoaded === null
              }
            />
            <Button
              title={!muted ? "Mute" : "Unmute"}
              onPress={handleMute}
              disabled={
                (volume === MIN_VOLUME_LEVEL && !muted) || hasLoaded === null
              }
            />
            <Button
              title="+"
              onPress={() => handleVolumeChange("increase")}
              disabled={
                volume === MAX_VOLUME_LEVEL || muted || hasLoaded === null
              }
            />
          </View>
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 30,
    margin: 20,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    minHeight: 275,
    backgroundColor: "#fff",
    gap: 20,
    borderRadius: 10,
    padding: 20,
    margin: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#eee",
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
    gap: 10,
  },
});
