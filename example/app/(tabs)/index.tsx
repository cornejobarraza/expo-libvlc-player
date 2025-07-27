import Slider from "@react-native-community/slider";
import {
  LibVlcPlayerView,
  LibVlcPlayerViewRef,
  type LibVlcSource,
  type Error,
  type Position,
  type VideoInfo,
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

const VLC_OPTIONS = ["--network-caching=1000"];
const BUFFERING_DELAY = 1_000;

const PRIMARY_PLAYER_SOURCE =
  "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const SECONDARY_PLAYER_SOURCE =
  "http://streams.videolan.org/streams/mp4/Mr_MrsSmith-h264_aac.mp4";

const PRIMARY_THUMBNAIL_POSITION = 27_000;
const SECONDARY_THUMBNAIL_POSITION = 77_000;

const MIN_POSITION_VALUE = 0;
const MAX_POSITION_VALUE = 1;

const MIN_VOLUME_LEVEL = 0;
const MAX_VOLUME_LEVEL = 100;
const VOLUME_CHANGE_STEP = 10;

type VolumeChange = "increase" | "decrease";
type RepeatMode = boolean | "once";

export default function Tab() {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [source, setSource] = useState<LibVlcSource>(PRIMARY_PLAYER_SOURCE);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(MAX_VOLUME_LEVEL);
  const [muted, setMuted] = useState<boolean>(false);
  const [repeat, setRepeat] = useState<RepeatMode>(false);

  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const [isBackgrounded, setIsBackgrounded] = useState<boolean>(false);
  const [isSeekable, setIsSeekable] = useState<boolean>(false);
  const [isParsed, setIsParsed] = useState<boolean | null>(null);

  const playerViewRef = useRef<LibVlcPlayerViewRef | null>(null);
  const bufferingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    unlockOrientation();
  }, []);

  const unlockOrientation = async () => unlockAsync();

  useEffect(() => {
    if (source !== null) {
      generateThumbnail();
    } else {
      resetPlayerState();
    }
  }, [source]);

  const generateThumbnail = async () => {
    try {
      if (typeof source !== "string") return;

      const { uri: url } = await getThumbnailAsync(source, {
        time:
          source === PRIMARY_PLAYER_SOURCE
            ? PRIMARY_THUMBNAIL_POSITION
            : SECONDARY_THUMBNAIL_POSITION,
      });

      setThumbnail(url);
    } catch {
      setThumbnail(null);
    }
  };

  const resetPlayerState = () => {
    setThumbnail(null);
    setPosition(0);
    setDuration(0);
    setIsBuffering(false);
    setIsPlaying(false);
    setIsStopped(false);
    setIsBackgrounded(false);
    setIsSeekable(false);
    setIsParsed(false);
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
      setIsStopped(false);
    },
    onPaused: () => {
      setIsBuffering(false);
      setIsPlaying(false);
      setIsStopped(false);
    },
    onStopped: () => {
      setIsBuffering(false);
      setIsPlaying(false);
      setIsStopped(true);
      setRepeat((prev) => (prev !== "once" ? prev : false));
    },
    onEncounteredError: ({ error }: Error) => {
      Alert.alert("Error", error);
      resetPlayerState();
    },
    onPositionChanged: ({ position }: Position) => {
      setPosition(position);
      setIsBuffering(false);
    },
    onParsedChanged: ({ duration, seekable }: VideoInfo) => {
      setDuration(duration);
      setIsSeekable(seekable);
      setIsParsed(true);
    },
    onBackground: () => {
      setIsBackgrounded(true);
    },
  };

  const handleSlidingComplete = (position: number) => {
    playerViewRef.current?.seek(position);
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

  const shouldShowLoader =
    (isParsed === null || isBuffering) && !isBackgrounded;

  const shouldShowThumbnail =
    !!thumbnail &&
    !isPlaying &&
    (position === MIN_POSITION_VALUE || isStopped || isBackgrounded);

  const hasNullState = source === null || isParsed === null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView overScrollMode="never" bounces={false}>
        <View style={styles.group}>
          <View
            style={{
              backgroundColor: "black",
              position: "relative",
              borderRadius: 5,
              aspectRatio: 16 / 9,
            }}
          >
            {source === null && (
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 30,
                }}
              >
                <Text style={{ color: "white", fontWeight: 500 }}>
                  NO MEDIA
                </Text>
              </View>
            )}
            {shouldShowLoader && (
              <ActivityIndicator
                style={{ ...StyleSheet.absoluteFillObject, zIndex: 20 }}
                color="white"
                size="large"
              />
            )}
            {shouldShowThumbnail && (
              <Image
                key={thumbnail} // Re-render on thumbnail change
                style={{
                  ...StyleSheet.absoluteFillObject,
                  width: "100%",
                  height: "100%",
                  borderRadius: 5,
                  zIndex: 10,
                }}
                source={{ uri: thumbnail }}
              />
            )}
            <LibVlcPlayerView
              key={source} // Re-render on source change
              ref={playerViewRef}
              style={{ height: "100%", borderRadius: 5 }}
              source={source}
              options={VLC_OPTIONS}
              volume={volume}
              mute={muted}
              repeat={repeat !== false}
              {...handlePlayerEvents}
            />
          </View>
          <Button
            title={
              source === null
                ? "Create media"
                : source === PRIMARY_PLAYER_SOURCE
                  ? "Change media"
                  : "Remove media"
            }
            onPress={() =>
              setSource((prev) =>
                prev === null
                  ? PRIMARY_PLAYER_SOURCE
                  : prev === PRIMARY_PLAYER_SOURCE
                    ? SECONDARY_PLAYER_SOURCE
                    : null,
              )
            }
          />
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
            disabled={!isSeekable || hasNullState}
          />
          <View style={styles.row}>
            <Button
              title={!isPlaying ? "Play" : "Pause"}
              onPress={handlePlayPause}
              disabled={hasNullState}
            />
            <Button
              title="Stop"
              onPress={handleStopPlayer}
              disabled={hasNullState}
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
              disabled={duration <= 0 || hasNullState}
            />
          </View>
          <View style={styles.row}>
            <Button
              title="-"
              onPress={() => handleVolumeChange("decrease")}
              disabled={volume === MIN_VOLUME_LEVEL || muted || hasNullState}
            />
            <Button
              title={!muted ? "Mute" : "Unmute"}
              onPress={handleMute}
              disabled={(volume === MIN_VOLUME_LEVEL && !muted) || hasNullState}
            />
            <Button
              title="+"
              onPress={() => handleVolumeChange("increase")}
              disabled={volume === MAX_VOLUME_LEVEL || muted || hasNullState}
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
