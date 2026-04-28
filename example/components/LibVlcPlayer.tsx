import { LibVlcPlayerView, type LibVlcPlayerViewRef, type LibVlcSource } from "expo-libvlc-player";
import { type SFSymbol } from "expo-symbols";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { Focusable } from "./Focusable";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface LibVlcPlayerProps {
  source: LibVlcSource;
  title?: string;
  fullScreen?: boolean;
}

interface PlayerControl {
  name: SFSymbol;
  onPress: () => void;
}

const MIN_VOLUME = 0;
const VOLUME_STEP = 10;
const MAX_VOLUME = 100;

const DEFAULT_TIME = 0;
const BUFFER_DELAY = 1_000;
const SEEK_STEP = 10_000;

const DEFAULT_FOCUSABLE = "" as SFSymbol;

export function LibVlcPlayer({ source, title, fullScreen }: LibVlcPlayerProps) {
  const [buffering, setBuffering] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(true);
  const [time, setTime] = useState<number>(DEFAULT_TIME);
  const [volume, setVolume] = useState<number>(MAX_VOLUME);
  const [focus, setFocus] = useState<SFSymbol>(DEFAULT_FOCUSABLE);

  const playerRef = useRef<LibVlcPlayerViewRef>(null);
  const bufferRef = useRef<number>(undefined);

  const PLAYER_CONTROLS: PlayerControl[] = [
    {
      name: "backward.fill",
      onPress: () => {
        void playerRef.current?.seek(time - SEEK_STEP);
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
        void playerRef.current?.[playing ? "pause" : "play"]();
      },
    },
    {
      name: "stop.fill",
      onPress: () => {
        void playerRef.current?.stop();
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
        void playerRef.current?.seek(time + SEEK_STEP);
      },
    },
  ];

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.libVlc, fullScreen && styles.libVlcFull]}>
      {!fullScreen && title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.container}>
        {buffering && <ActivityIndicator style={styles.buffering} color="#f1f1f1" size="large" />}
        <LibVlcPlayerView
          ref={playerRef}
          style={[styles.player, fullScreen && { borderRadius: 0 }]}
          source={source}
          aspectRatio="16:9"
          volume={volume}
          onBuffering={() => {
            setBuffering(true);
            clearTimeout(bufferRef.current);
            bufferRef.current = setTimeout(() => {
              setBuffering(false);
            }, BUFFER_DELAY);
          }}
          onPlaying={() => {
            setFocus((prev) => (prev !== DEFAULT_FOCUSABLE ? "pause.fill" : prev));
            setPlaying(true);
          }}
          onPaused={() => {
            setFocus((prev) => (prev !== DEFAULT_FOCUSABLE ? "play.fill" : prev));
            setPlaying(false);
          }}
          onStopped={() => {
            setPlaying(false);
          }}
          onEncounteredError={({ message }) => {
            Alert.alert("Error", message);
          }}
          onTimeChanged={({ value }) => {
            setTime(value);
          }}
        />
      </View>
      <View
        style={[
          styles.controls,
          fullScreen && [styles.controlsFull, { paddingBottom: insets.bottom }],
        ]}>
        {PLAYER_CONTROLS.map((control, index) => (
          <Focusable
            key={index}
            name={control.name}
            focused={focus === control.name}
            onFocus={() => {
              setFocus(control.name);
            }}
            onPressIn={control.onPress}
            onPressOut={() => {
              setFocus(DEFAULT_FOCUSABLE);
            }}
          />
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
  title: {
    color: "#f1f1f1",
    fontSize: 20,
    fontWeight: "bold",
  },
  container: {
    position: "relative",
  },
  buffering: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
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
  },
});
