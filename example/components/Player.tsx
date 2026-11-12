import { LibVlcPlayerView, type LibVlcPlayerViewRef, type Metadata } from "expo-libvlc-player";
import { Fragment, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  css,
  cubicBezier,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Control } from "./Control";
import { Poster } from "./Poster";
import { Text } from "./Text";
import {
  PLAYER_ASPECT_RATIO,
  PLAYER_CONTENT_FIT,
  PLAYER_DEFAULT_TIME,
  PLAYER_MAX_BUFFER,
  PLAYER_MAX_VOLUME,
  PLAYER_MIN_VOLUME,
  PLAYER_OPTIONS,
  PLAYER_SEEK_STEP,
  PLAYER_VOLUME_STEP,
} from "./constants";
import { type ControlProps, type PlayerProps } from "./types";
import { useControls } from "../hooks/useControls";
import { useTimedBoolean } from "../hooks/useTimedBoolean";

const VLC_ICON = require("../assets/vlc.png");

export const Player = ({ source, poster, fullscreen }: PlayerProps) => {
  const [buffering, setBuffering] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const [backgrounded, setBackgrounded] = useState<boolean>(false);
  const [time, setTime] = useState<number>(PLAYER_DEFAULT_TIME);
  const [volume, setVolume] = useState<number>(PLAYER_MAX_VOLUME);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [parsing, setParsing] = useTimedBoolean(true);

  const playerRef = useRef<LibVlcPlayerViewRef>(null);

  const playerControls: ControlProps[] = [
    {
      name: "backward.fill",
      onPress: () => {
        playerRef.current?.seek(time - PLAYER_SEEK_STEP);
      },
    },
    {
      name: "speaker.1.fill",
      onPress: () => {
        setVolume((prev) => Math.max(prev - PLAYER_VOLUME_STEP, PLAYER_MIN_VOLUME));
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
      },
    },
    {
      name: "speaker.3.fill",
      onPress: () => {
        setVolume((prev) => Math.min(prev + PLAYER_VOLUME_STEP, PLAYER_MAX_VOLUME));
      },
    },
    {
      name: "forward.fill",
      onPress: () => {
        playerRef.current?.seek(time + PLAYER_SEEK_STEP);
      },
    },
  ];

  const showPoster = (!playing && backgrounded) || time === PLAYER_DEFAULT_TIME;
  const showBuffering = !parsing && buffering;
  const posterSource = typeof poster === "string" ? { uri: poster } : poster;
  const insets = useSafeAreaInsets();

  const controls = useControls(fullscreen);
  const slideAnimation = controls.visible ? animations.enter : animations.exit;
  const controlsAnimation = fullscreen && slideAnimation;

  const header = (
    <View style={styles.header}>
      {!parsing ? (
        <Fragment>
          <Text style={styles.title} numberOfLines={1}>
            {metadata?.title || "Media Player"}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {metadata?.artist || "Powered by LibVLC"}
          </Text>
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
    <View style={[styles.player, fullscreen && styles.fullscreen]}>
      {!fullscreen && header}
      <View style={styles.container}>
        <LayoutAnimationConfig skipEntering>
          {showPoster && (
            <Animated.View
              style={styles.poster}
              entering={FadeIn}
              exiting={FadeOut}
              testID="poster">
              {!parsing ? (
                posterSource != null ? (
                  <Poster
                    style={[
                      styles.image,
                      !fullscreen ? styles.rounded : styles.square,
                      { aspectRatio: PLAYER_ASPECT_RATIO, objectFit: PLAYER_CONTENT_FIT },
                    ]}
                    source={posterSource}
                  />
                ) : (
                  <View
                    style={[
                      styles.image,
                      styles.placeholder,
                      !fullscreen ? styles.rounded : styles.square,
                    ]}>
                    <Image source={VLC_ICON} />
                  </View>
                )
              ) : (
                <Poster.Loading
                  width="100%"
                  height="100%"
                  borderRadius={
                    !fullscreen ? styles.rounded.borderRadius : styles.square.borderRadius
                  }
                />
              )}
            </Animated.View>
          )}
        </LayoutAnimationConfig>
        {showBuffering && (
          <ActivityIndicator style={styles.buffering} color="#f1f1f1" size="large" />
        )}
        <LibVlcPlayerView
          ref={playerRef}
          style={[styles.view, !fullscreen ? styles.rounded : styles.square]}
          source={source}
          options={PLAYER_OPTIONS}
          aspectRatio={PLAYER_ASPECT_RATIO}
          contentFit={PLAYER_CONTENT_FIT}
          volume={volume}
          onBuffering={({ value }) => {
            setBuffering(value < PLAYER_MAX_BUFFER);
          }}
          onPlaying={() => {
            setPlaying(true);
          }}
          onPaused={() => {
            setPlaying(false);
          }}
          onStopped={() => {
            setPlaying(false);
            setTime(PLAYER_DEFAULT_TIME);
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
      {fullscreen && (
        <Pressable style={styles.surface} onPress={controls.toggle} testID="surface">
          <Animated.View style={[styles.scrim, controlsAnimation]} pointerEvents="none" />
        </Pressable>
      )}
      {fullscreen && (
        <Animated.View
          style={[
            styles.heading,
            { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
            controlsAnimation,
            !controls.visible && animations.raised,
          ]}
          pointerEvents="none">
          {header}
        </Animated.View>
      )}
      <View
        key={fullscreen ? "overlay" : "inline"}
        style={[
          styles.controls,
          fullscreen && styles.overlay,
          fullscreen && { paddingBottom: insets.bottom },
        ]}
        pointerEvents={controls.visible ? "box-none" : "none"}>
        {/* eslint-disable-next-line react-hooks/refs */}
        {playerControls.map(({ name, onPress }) => (
          <Animated.View
            key={name}
            style={[controlsAnimation, !controls.visible && animations.lowered]}>
            {!parsing ? (
              <Control
                name={name}
                translucent={fullscreen}
                onPress={() => {
                  onPress?.();
                  controls.show();
                }}
              />
            ) : (
              <Control.Loading />
            )}
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
  fullscreen: {
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
  placeholder: {
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
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
