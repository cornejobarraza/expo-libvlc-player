import { LibVlcPlayerView, LibVlcPlayerViewRef } from "expo-libvlc-player";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { IconSymbol } from "./components/IconSymbol";

const BIG_BUCK_BUNNY =
  "https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov";

export default function App() {
  const [buffering, setBuffering] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(true);
  const [time, setTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);

  const playerRef = useRef<LibVlcPlayerViewRef | null>(null);
  const bufferingRef = useRef<NodeJS.Timeout | null>(null);

  const handleBuffering = () => {
    setBuffering(true);

    if (bufferingRef.current) {
      clearTimeout(bufferingRef.current);
    }

    bufferingRef.current = setTimeout(() => setBuffering(false), 1_000);
  };

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <Text style={styles.title}>Big Buck Bunny</Text>
      <View style={styles.container}>
        {buffering && (
          <ActivityIndicator
            style={styles.buffering}
            color="#f1f1f1"
            size="large"
          />
        )}
        <LibVlcPlayerView
          ref={playerRef}
          style={styles.player}
          source={BIG_BUCK_BUNNY}
          volume={volume}
          onBuffering={handleBuffering}
          onPlaying={() => setPlaying(true)}
          onPaused={() => setPlaying(false)}
          onStopped={() => setPlaying(false)}
          onEncounteredError={({ error }) => Alert.alert("Error", error)}
          onTimeChanged={({ time }) => setTime(time)}
        />
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => playerRef.current?.seek(time - 5_000)}
        >
          <IconSymbol color="#f1f1f1" name="backward.fill" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setVolume((prev) => prev - 10)}
          disabled={volume === 0}
        >
          <IconSymbol color="#f1f1f1" name="speaker.1.fill" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => playerRef.current?.[!playing ? "play" : "pause"]()}
        >
          <IconSymbol
            color="#f1f1f1"
            name={!playing ? "play.fill" : "pause.fill"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => playerRef.current?.stop()}
        >
          <IconSymbol color="#f1f1f1" name="stop.fill" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setVolume((prev) => prev + 10)}
          disabled={volume === 100}
        >
          <IconSymbol color="#f1f1f1" name="speaker.3.fill" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => playerRef.current?.seek(time + 5_000)}
        >
          <IconSymbol color="#f1f1f1" name="forward.fill" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    justifyContent: "center",
    gap: 20,
    padding: 24,
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
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  button: {
    backgroundColor: "#272727",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});
