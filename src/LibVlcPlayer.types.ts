import type { ViewProps } from "react-native";

export interface LibVlcPlayerViewRef {
  /**
   * Starts playback of the current player
   *
   * @returns A promise which resolves to `void`
   */
  readonly play: () => Promise<void>;
  /**
   * Pauses playback of the current player
   *
   * @returns A promise which resolves to `void`
   */
  readonly pause: () => Promise<void>;
  /**
   * Stops playback of the current player
   *
   * @returns A promise which resolves to `void`
   */
  readonly stop: () => Promise<void>;
  /**
   * Sets the position of the current player
   *
   * @param position - Must be a float number between `0` and `1`
   *
   * @returns void
   */
  readonly seek: (position: number) => Promise<void>;
}

/**
 * @hidden
 */
export type BufferingListener = () => void;

/**
 * @hidden
 */
export type PlayingListener = () => void;

/**
 * @hidden
 */
export type PausedListener = () => void;

/**
 * @hidden
 */
export type StoppedListener = () => void;

/**
 * @hidden
 */
export type EndedListener = () => void;

/**
 * @hidden
 */
export type RepeatListener = () => void;

/**
 * @hidden
 */
export type ErrorListener = (event: { nativeEvent: Error }) => void;

export type Error = { error: string };

/**
 * @hidden
 */
export type PositionChangedListener = (event: {
  nativeEvent: PositionChanged;
}) => void;

export type PositionChanged = { position: number };

/**
 * @hidden
 */
export type LoadListener = (event: { nativeEvent: VideoInfo }) => void;

export interface Track {
  id: number;
  name: string;
}

export interface Tracks {
  video: Track[];
  audio: Track[];
  subtitle: Track[];
}

export interface VideoInfo {
  width: number;
  height: number;
  aspectRatio: string | null;
  duration: number;
  tracks: Tracks;
  seekable: boolean;
}

/**
 * @hidden
 */
export type BackgroundListener = (event: { nativeEvent: Background }) => void;

export type Background = { background: boolean };

export interface Subtitle {
  uri: string;
  enable: boolean;
}

export interface TracksOptions {
  video: number;
  audio: number;
  subtitle: number;
}

/**
 * @hidden
 */
export interface LibVlcPlayerViewNativeProps {
  ref?: React.Ref<LibVlcPlayerViewRef>;
  uri?: string;
  subtitle?: Subtitle;
  options?: string[];
  volume?: number;
  mute?: boolean;
  rate?: number;
  tracks?: TracksOptions;
  time?: number;
  repeat?: boolean;
  aspectRatio?: string;
  audioMixingMode?: AudioMixingMode;
  playInBackground?: boolean;
  autoplay?: boolean;
  onBuffering?: BufferingListener;
  onPlaying?: PlayingListener;
  onPaused?: PausedListener;
  onStopped?: StoppedListener;
  onEnded?: EndedListener;
  onRepeat?: RepeatListener;
  onError?: ErrorListener;
  onPositionChanged?: PositionChangedListener;
  onLoad?: LoadListener;
  onBackground?: BackgroundListener;
}

export type AudioMixingMode =
  | "mixWithOthers"
  | "duckOthers"
  | "auto"
  | "doNotMix";

export interface LibVlcPlayerViewProps extends ViewProps {
  /**
   * Sets the URI of the media to be played
   */
  uri: string;
  /**
   * Sets the subtitle URI and its enabled state
   *
   * @example
   * ```tsx
   * <LibVlcPlayerView
   *    subtitle={{
   *      uri: "file://",
   *      enable: false,
   *    }}
   * />
   * ```
   */
  subtitle?: Subtitle;
  /**
   * https://wiki.videolan.org/VLC_command-line_help/
   *
   * Sets the VLC options to initialize the player with
   *
   * @example ["--network-caching=1000"]
   *
   * @default []
   */
  options?: string[];
  /**
   * Sets the player volume. Must be an integer number between `0` and `100`
   *
   * @default 100
   */
  volume?: number;
  /**
   * Sets the player volume to `0`
   *
   * @default false
   */
  mute?: boolean;
  /**
   * Sets the player rate. Must be a float number
   *
   * @default 1
   */
  rate?: number;
  /**
   * Sets the player video, audio and subtitle track indexes
   *
   * @example
   * ```tsx
   * <LibVlcPlayerView
   *    tracks={{
   *      video: 0,
   *      audio: 1,
   *      subtitle: 2,
   *    }}
   * />
   * ```
   */
  tracks?: TracksOptions;
  /**
   * Sets the initial player time. Must be an integer number in milliseconds
   *
   * @default 0
   */
  time?: number;
  /**
   * Determines whether the player should repeat the media after playback ends
   *
   * @default false
   */
  repeat?: boolean;
  /**
   * Sets the player aspect ratio. Must be a valid string
   *
   * @example "16:9"
   */
  aspectRatio?: string;
  /**
   * Determines how the player will interact with other audio playing in the system
   *
   * @default "auto"
   */
  audioMixingMode?: AudioMixingMode;
  /**
   * Determines whether the player should continue playing after the app enters the background
   *
   * @default false
   */
  playInBackground?: boolean;
  /**
   * Autoplays the media once created
   *
   * @default true
   */
  autoplay?: boolean;
  /**
   * Called after the `Buffering` player event
   */
  onBuffering?: () => void;
  /**
   * Called after the `Playing` player event
   */
  onPlaying?: () => void;
  /**
   * Called after the `Paused` player event
   */
  onPaused?: () => void;
  /**
   * Called after the `Stopped` player event
   */
  onStopped?: () => void;
  /**
   * Called after the `EndReached` player event
   */
  onEnded?: () => void;
  /**
   * Called after the player repeats the media
   */
  onRepeat?: () => void;
  /**
   * Called after the `EncounteredError` player event
   */
  onError?: (event: Error) => void;
  /**
   * Called after the `PositionChanged` player event
   */
  onPositionChanged?: (event: PositionChanged) => void;
  /**
   * Called after the player loads the media
   */
  onLoad?: (event: VideoInfo) => void;
  /**
   * Called after the player enters or exits the background
   */
  onBackground?: (event: Background) => void;
}
