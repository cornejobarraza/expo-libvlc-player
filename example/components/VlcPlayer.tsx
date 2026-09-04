import { LibVlcPlayerView, type LibVlcPlayerViewRef, type MediaMetadata } from "expo-libvlc-player";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "./Text";
import { VlcControl } from "./VlcControl";
import { type VlcControlProps, type VlcPlayerProps } from "./types";

const MIN_VOLUME = 0;
const MAX_VOLUME = 100;
const VOLUME_STEP = 10;

const MAX_BUFFER = 1;
const DEFAULT_TIME = 0;
const SEEK_STEP = 10_000;

// Android Emulator specific codec
const AVCODEC_OPTION = ":codec=avcodec";

export const VlcPlayer = ({ source, fullScreen }: VlcPlayerProps) => {
  const [buffering, setBuffering] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const [backgrounded, setBackgrounded] = useState<boolean>(false);
  const [time, setTime] = useState<number>(DEFAULT_TIME);
  const [volume, setVolume] = useState<number>(MAX_VOLUME);
  const [parsing, setParsing] = useState<boolean>(true);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);

  const playerRef = useRef<LibVlcPlayerViewRef>(null);

  const { bottom: paddingBottom } = useSafeAreaInsets();

  const playerControls: VlcControlProps[] = [
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
        setBackgrounded(false);
      },
    },
    {
      name: "stop.fill",
      onPress: () => {
        playerRef.current?.stop();
        setBackgrounded(false);
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

  const showTitle = metadata?.title != null && metadata.title !== "";
  const showArtist = metadata?.artist != null && metadata.artist !== "";
  const showPoster = (!playing && backgrounded) || time === DEFAULT_TIME;

  return (
    <View style={[styles.libVlc, fullScreen && styles.libVlcFull]}>
      {!fullScreen && (
        <View style={styles.header}>
          {!parsing ? (
            <React.Fragment>
              {showTitle && (
                <Text style={styles.title} numberOfLines={1}>
                  {metadata.title}
                </Text>
              )}
              {showArtist && (
                <Text style={styles.artist} numberOfLines={1}>
                  {metadata.artist}
                </Text>
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Text.Loading width="50%" height={styles.title.lineHeight} />
              <Text.Loading width="75%" height={styles.artist.lineHeight} />
            </React.Fragment>
          )}
        </View>
      )}
      <View style={styles.container}>
        {showPoster && (
          <View style={styles.poster} testID="poster">
            <Image
              style={[styles.image, !fullScreen ? styles.rounded : styles.square]}
              source={require("../assets/bbb.png")}
              resizeMode="contain"
            />
          </View>
        )}
        {buffering && <ActivityIndicator style={styles.buffering} color="#f1f1f1" size="large" />}
        <LibVlcPlayerView
          ref={playerRef}
          style={[styles.player, !fullScreen ? styles.rounded : styles.square]}
          source={source}
          options={[AVCODEC_OPTION]}
          aspectRatio="16:9"
          volume={volume}
          onBuffering={({ value }) => {
            setBuffering(value < MAX_BUFFER);
          }}
          onPlaying={() => {
            setPlaying(true);
          }}
          onPaused={() => {
            setPlaying(false);
          }}
          onStopped={() => {
            setPlaying(false);
            setTime(DEFAULT_TIME);
          }}
          onEncounteredError={({ message }) => {
            Alert.alert("Error", message);
            setBuffering(false);
            setParsing(false);
          }}
          onTimeChanged={({ value }) => {
            setTime(value);
          }}
          onFirstPlay={(info) => {
            setMetadata(info.metadata);
            setParsing(false);
          }}
          onBackground={() => {
            setBackgrounded(true);
          }}
        />
      </View>
      <View
        style={[styles.controls, fullScreen && styles.overlay, fullScreen && { paddingBottom }]}>
        {/* eslint-disable-next-line react-hooks/refs */}
        {playerControls.map(({ name, onPress }) => (
          <VlcControl key={name} name={name} onPress={onPress} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  libVlc: {
    gap: 24,
  },
  libVlcFull: {
    alignItems: "center",
    position: "relative",
  },
  header: {
    gap: 8,
  },
  title: {
    color: "#f1f1f1",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "bold",
  },
  artist: {
    color: "#f1f1f1",
    fontSize: 16,
    lineHeight: 20,
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
  },
  player: {
    backgroundColor: "#000000",
  },
  rounded: {
    borderRadius: 12,
  },
  square: {
    borderRadius: 0,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    bottom: 24,
    alignItems: "flex-end",
    zIndex: 9999,
  },
});
