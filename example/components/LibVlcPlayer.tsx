import { LibVlcPlayerView, LibVlcPlayerViewRef, type LibVlcSource } from "expo-libvlc-player";
import { SFSymbol } from "expo-symbols";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { Focusable } from "./Focusable";

const MIN_VOLUME = 0;
const VOLUME_STEP = 10;
const MAX_VOLUME = 100;

const DEFAULT_TIME = 0;
const BUFFERING_DELAY = 1_000;
const SEEK_STEP = 10_000;

interface LibVlcPlayerProps {
  source: LibVlcSource;
  title?: string;
  fullScreen?: boolean;
}

const EMPTY_FOCUSABLE = "" as SFSymbol;

export function LibVlcPlayer({ source, title, fullScreen }: LibVlcPlayerProps) {
  const [buffering, setBuffering] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(true);
  const [time, setTime] = useState<number>(DEFAULT_TIME);
  const [volume, setVolume] = useState<number>(MAX_VOLUME);
  const [focusable, setFocusable] = useState<SFSymbol>(EMPTY_FOCUSABLE);

  const playerRef = useRef<LibVlcPlayerViewRef>(null);
  const bufferingRef = useRef<number>(undefined);

  return (
    <View style={fullScreen ? styles.libVlcFull : styles.libVlc}>
      {!fullScreen && title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.container}>
        {buffering && <ActivityIndicator style={styles.buffering} color="#f1f1f1" size="large" />}
        <LibVlcPlayerView
          key={source}
          ref={playerRef}
          style={fullScreen ? styles.playerFull : styles.player}
          source={source}
          aspectRatio="16:9"
          volume={volume}
          onBuffering={() => {
            setBuffering(true);
            clearTimeout(bufferingRef.current);
            bufferingRef.current = setTimeout(() => setBuffering(false), BUFFERING_DELAY);
          }}
          onPlaying={() => setPlaying(true)}
          onPaused={() => setPlaying(false)}
          onStopped={() => setPlaying(false)}
          onEncounteredError={({ message }) => Alert.alert("Error", message)}
          onTimeChanged={({ value }) => setTime(value)}
        />
      </View>
      <View style={fullScreen ? styles.controlsFull : styles.controls}>
        <Focusable
          name="backward.fill"
          focused={focusable === "backward.fill"}
          onFocus={() => setFocusable("backward.fill")}
          onPressIn={() => playerRef.current?.seek(time - SEEK_STEP)}
          onPressOut={() => setFocusable(EMPTY_FOCUSABLE)}
        />
        <Focusable
          name="speaker.1.fill"
          focused={focusable === "speaker.1.fill"}
          onFocus={() => setFocusable("speaker.1.fill")}
          onPressIn={() => setVolume((prev) => Math.max(prev - VOLUME_STEP, MIN_VOLUME))}
          onPressOut={() => setFocusable(EMPTY_FOCUSABLE)}
        />
        <Focusable
          name={playing ? "pause.fill" : "play.fill"}
          focused={focusable === "play.fill" || focusable === "pause.fill"}
          onFocus={() => setFocusable(playing ? "pause.fill" : "play.fill")}
          onPressIn={() => playerRef.current?.[playing ? "pause" : "play"]()}
          onPressOut={() => setFocusable(EMPTY_FOCUSABLE)}
        />
        <Focusable
          name="stop.fill"
          focused={focusable === "stop.fill"}
          onFocus={() => setFocusable("stop.fill")}
          onPressIn={() => playerRef.current?.stop()}
          onPressOut={() => setFocusable(EMPTY_FOCUSABLE)}
        />
        <Focusable
          name="speaker.3.fill"
          focused={focusable === "speaker.3.fill"}
          onFocus={() => setFocusable("speaker.3.fill")}
          onPressIn={() => setVolume((prev) => Math.min(prev + VOLUME_STEP, MAX_VOLUME))}
          onPressOut={() => setFocusable(EMPTY_FOCUSABLE)}
        />
        <Focusable
          name="forward.fill"
          focused={focusable === "forward.fill"}
          onFocus={() => setFocusable("forward.fill")}
          onPressIn={() => playerRef.current?.seek(time + SEEK_STEP)}
          onPressOut={() => setFocusable(EMPTY_FOCUSABLE)}
        />
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
  playerFull: {
    backgroundColor: "black",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  controlsFull: {
    ...StyleSheet.absoluteFill,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 16,
  },
});
