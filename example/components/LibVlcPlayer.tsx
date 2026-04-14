import { LibVlcPlayerView, LibVlcPlayerViewRef, type LibVlcSource } from "expo-libvlc-player";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "./IconSymbol";

const MIN_VOLUME = 0;
const VOLUME_STEP = 10;
const MAX_VOLUME = 100;

const DEFAULT_TIME = 0;
const BUFFERING_DELAY = 1_000;
const SEEK_STEP = 10_000;

interface LibVlcPlayerProps {
  title?: string;
  source: LibVlcSource;
}

export function LibVlcPlayer({ title, source }: LibVlcPlayerProps) {
  const [buffering, setBuffering] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(true);
  const [time, setTime] = useState<number>(DEFAULT_TIME);
  const [volume, setVolume] = useState<number>(MAX_VOLUME);

  const playerRef = useRef<LibVlcPlayerViewRef>(null);
  const bufferingRef = useRef<number>(undefined);

  return (
    <View style={styles.libvlc}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.container}>
        {buffering && <ActivityIndicator style={styles.buffering} color="#f1f1f1" size="large" />}
        <LibVlcPlayerView
          key={source}
          ref={playerRef}
          style={styles.player}
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
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.control}
          onPress={() => playerRef.current?.seek(time - SEEK_STEP)}>
          <IconSymbol color="#f1f1f1" name="backward.fill" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.control}
          onPress={() => setVolume((prev) => Math.max(prev - VOLUME_STEP, MIN_VOLUME))}>
          <IconSymbol color="#f1f1f1" name="speaker.1.fill" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.control}
          onPress={() => playerRef.current?.[!playing ? "play" : "pause"]()}>
          <IconSymbol color="#f1f1f1" name={!playing ? "play.fill" : "pause.fill"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.control} onPress={() => playerRef.current?.stop()}>
          <IconSymbol color="#f1f1f1" name="stop.fill" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.control}
          onPress={() => setVolume((prev) => Math.min(prev + VOLUME_STEP, MAX_VOLUME))}>
          <IconSymbol color="#f1f1f1" name="speaker.3.fill" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.control}
          onPress={() => playerRef.current?.seek(time + SEEK_STEP)}>
          <IconSymbol color="#f1f1f1" name="forward.fill" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  libvlc: {
    gap: 20,
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  player: {
    backgroundColor: "black",
    borderRadius: 12,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  control: {
    backgroundColor: "#272727",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});
