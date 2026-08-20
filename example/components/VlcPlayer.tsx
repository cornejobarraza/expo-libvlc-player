import { LibVlcPlayerView, type LibVlcPlayerViewRef } from "expo-libvlc-player";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VlcControl } from "./VlcControl";
import { type VlcControlProps, type VlcPlayerProps } from "./types";

const MIN_VOLUME = 0;
const MAX_VOLUME = 100;
const VOLUME_STEP = 10;

const DEFAULT_TIME = 0;
const SEEK_STEP = 10_000;

export function VlcPlayer({ source, fullScreen }: VlcPlayerProps) {
  const [buffering, setBuffering] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const [time, setTime] = useState<number>(DEFAULT_TIME);
  const [volume, setVolume] = useState<number>(MAX_VOLUME);
  const [background, setBackground] = useState<boolean>(false);

  const playerRef = useRef<LibVlcPlayerViewRef>(null);

  const PLAYER_CONTROLS: VlcControlProps[] = [
    {
      name: "backward.fill",
      onPress: () => {
        playerRef.current?.seek(time - SEEK_STEP);
      },
    },
    {
      name: "speaker.1.fill",
      onPress: () => {
        setVolume((prev) => Math.max(prev - VOLUME_STEP, MIN_VOLUME));
      },
    },
    {
      name: playing ? "pause.fill" : "play.fill",
      onPress: () => {
        playerRef.current?.[playing ? "pause" : "play"]();
      },
    },
    {
      name: "stop.fill",
      onPress: () => {
        playerRef.current?.stop();
      },
    },
    {
      name: "speaker.3.fill",
      onPress: () => {
        setVolume((prev) => Math.min(prev + VOLUME_STEP, MAX_VOLUME));
      },
    },
    {
      name: "forward.fill",
      onPress: () => {
        playerRef.current?.seek(time + SEEK_STEP);
      },
    },
  ];

  const showPoster = (!playing && background) || time === 0;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.libVlc, fullScreen && styles.libVlcFull]}>
      <View style={styles.container}>
        {showPoster && (
          <View style={styles.poster}>
            <Image
              style={[styles.image, fullScreen && { borderRadius: 0 }]}
              source={require("../assets/bbb.png")}
              resizeMode="contain"
            />
          </View>
        )}
        {buffering && <ActivityIndicator style={styles.buffering} color="#f1f1f1" size="large" />}
        <LibVlcPlayerView
          ref={playerRef}
          style={[styles.player, fullScreen && { borderRadius: 0 }]}
          source={source}
          aspectRatio="16:9"
          volume={volume}
          onBuffering={({ value }) => {
            setBuffering(value < 1);
          }}
          onPlaying={() => {
            setPlaying(true);
            setBackground(false);
          }}
          onPaused={() => {
            setPlaying(false);
          }}
          onStopped={() => {
            setPlaying(false);
            setTime(0);
          }}
          onEncounteredError={({ message }) => {
            Alert.alert("Error", message);
          }}
          onTimeChanged={({ value }) => {
            setTime(value);
          }}
          onBackground={() => {
            setBackground(true);
          }}
        />
      </View>
      <View
        style={[
          styles.controls,
          fullScreen && [styles.controlsFull, { paddingBottom: insets.bottom }],
        ]}>
        {/* eslint-disable-next-line react-hooks/refs */}
        {PLAYER_CONTROLS.map((control, index) => (
          <VlcControl key={index} name={control.name} onPress={control.onPress} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  libVlc: {
    gap: 20,
  },
  libVlcFull: {
    alignItems: "center",
    position: "relative",
  },
  container: {
    position: "relative",
  },
  buffering: {
    ...StyleSheet.absoluteFill,
    zIndex: 9998,
  },
  poster: {
    ...StyleSheet.absoluteFill,
    zIndex: 9997,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  player: {
    backgroundColor: "black",
    borderRadius: 12,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  controlsFull: {
    ...StyleSheet.absoluteFill,
    bottom: 20,
    alignItems: "flex-end",
    zIndex: 9999,
  },
});
