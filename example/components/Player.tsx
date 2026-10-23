import { LibVlcPlayerView, type LibVlcPlayerViewRef, type Metadata } from "expo-libvlc-player";
import { Fragment, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from "react-native";
import Animated, { css, cubicBezier } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Control } from "./Control";
import { Text } from "./Text";
import { type ControlProps, type PlayerProps } from "./types";
import {
  ASPECT_RATIO,
  CONTENT_FIT,
  DEFAULT_TIME,
  MAX_BUFFER,
  MAX_VOLUME,
  MIN_VOLUME,
  OPTIONS,
  SEEK_STEP,
  VOLUME_STEP,
} from "../constants";
import { useControls } from "../hooks/useControls";

export const Player = ({ source, fullScreen }: PlayerProps) => {
  const [buffering, setBuffering] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const [backgrounded, setBackgrounded] = useState<boolean>(false);
  const [time, setTime] = useState<number>(DEFAULT_TIME);
  const [volume, setVolume] = useState<number>(MAX_VOLUME);
  const [parsing, setParsing] = useState<boolean>(!!source);
  const [metadata, setMetadata] = useState<Metadata | null>(null);

  const playerRef = useRef<LibVlcPlayerViewRef>(null);

  const playerControls: ControlProps[] = [
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
        setTime(DEFAULT_TIME);
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

  const showArtist = metadata?.artist != null && metadata.artist !== "";
  const showPoster = (!playing && backgrounded) || time === DEFAULT_TIME;
  const insets = useSafeAreaInsets();

  const controls = useControls(fullScreen);
  const controlsAnimation = controls.visible ? animations.enter : animations.exit;
  const fullScreenAnimation = fullScreen && controlsAnimation;

  const header = (
    <View style={styles.header}>
      {!parsing ? (
        <Fragment>
          <Text style={styles.title} numberOfLines={1}>
            {metadata?.title || "LibVLC Player"}
          </Text>
          {showArtist && (
            <Text style={styles.artist} numberOfLines={1}>
              {metadata.artist}
            </Text>
          )}
        </Fragment>
      ) : (
        <Fragment>
          <Text.Loading width="50%" height={styles.title.lineHeight} />
          <Text.Loading width="75%" height={styles.artist.lineHeight} />
        </Fragment>
      )}
    </View>
  );

  return (
    <View style={[styles.player, fullScreen && styles.fullScreen]}>
      {!fullScreen && header}
      <View style={styles.container}>
        {showPoster && (
          <View style={styles.poster} testID="poster">
            <Image
              style={[
                styles.image,
                !fullScreen ? styles.rounded : styles.square,
                { aspectRatio: ASPECT_RATIO, objectFit: CONTENT_FIT },
              ]}
              source={require("../assets/bbb.png")}
            />
          </View>
        )}
        {buffering && <ActivityIndicator style={styles.buffering} color="#f1f1f1" size="large" />}
        <LibVlcPlayerView
          ref={playerRef}
          style={[styles.view, !fullScreen ? styles.rounded : styles.square]}
          source={source}
          options={OPTIONS}
          aspectRatio={ASPECT_RATIO}
          contentFit={CONTENT_FIT}
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
      {fullScreen && (
        <Pressable style={styles.surface} onPress={controls.toggle} testID="surface">
          <Animated.View style={[styles.scrim, fullScreenAnimation]} pointerEvents="none" />
        </Pressable>
      )}
      {fullScreen && (
        <Animated.View
          style={[
            styles.heading,
            { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
            fullScreenAnimation,
            !controls.visible && animations.raised,
          ]}
          pointerEvents="none">
          {header}
        </Animated.View>
      )}
      <View
        key={fullScreen ? "overlay" : "inline"}
        style={[
          styles.controls,
          fullScreen && styles.overlay,
          fullScreen && { paddingBottom: insets.bottom },
        ]}
        pointerEvents={controls.visible ? "box-none" : "none"}>
        {/* eslint-disable-next-line react-hooks/refs */}
        {playerControls.map(({ name, onPress }) => (
          <Animated.View
            key={name}
            style={[fullScreenAnimation, !controls.visible && animations.lowered]}>
            <Control
              name={name}
              translucent={fullScreen}
              onPress={() => {
                onPress?.();
                controls.show();
              }}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const animations = css.create({
  enter: {
    opacity: 1,
    transform: [{ translateY: 0 }],
    transitionProperty: ["opacity", "transform"],
    transitionDuration: "300ms",
    transitionTimingFunction: cubicBezier(0.22, 1, 0.36, 1),
  },
  exit: {
    opacity: 0,
    transform: [{ translateY: 0 }],
    transitionProperty: ["opacity", "transform"],
    transitionDuration: "450ms",
    transitionTimingFunction: cubicBezier(0.64, 0, 0.78, 0),
  },
  raised: {
    transform: [{ translateY: -24 }],
  },
  lowered: {
    transform: [{ translateY: 24 }],
  },
});

const styles = StyleSheet.create({
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
  player: {
    gap: 24,
  },
  fullScreen: {
    alignItems: "center",
    position: "relative",
  },
  container: {
    position: "relative",
  },
  poster: {
    ...StyleSheet.absoluteFill,
    zIndex: 9997,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  rounded: {
    borderRadius: 12,
  },
  square: {
    borderRadius: 0,
  },
  buffering: {
    ...StyleSheet.absoluteFill,
    zIndex: 9998,
  },
  view: {
    backgroundColor: "#000000",
  },
  surface: {
    ...StyleSheet.absoluteFill,
    zIndex: 9998,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundImage:
      "linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent 40%, transparent 70%, rgba(0, 0, 0, 0.6))",
  },
  heading: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    alignItems: "flex-start",
    zIndex: 9999,
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
