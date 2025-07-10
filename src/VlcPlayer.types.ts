import type { ViewProps } from "react-native";

export interface VLCPlayerViewRef {
  /**
   * Starts playback for the current player
   *
   * @returns A promise which resolves to `void`
   */
  readonly play: () => Promise<void>;
  /**
   * Pauses playback for the current player
   *
   * @returns A promise which resolves to `void`
   */
  readonly pause: () => Promise<void>;
  /**
   * Stops playback for the current player
   *
   * @returns A promise which resolves to `void`
   */
  readonly stop: () => Promise<void>;
  /**
   * Sets position of the current player
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

/**
 * @hidden
 */
export type BackgroundListener = () => void;

export interface Track {
  id: number;
  name: string;
}

export interface VideoTracks {
  audio: Track[];
  subtitle: Track[];
}

export interface VideoInfo {
  width: number;
  height: number;
  aspectRatio: string | null;
  duration: number;
  tracks: VideoTracks;
  seekable: boolean;
}

export interface Subtitle {
  uri: string;
  enable: boolean;
}

export interface TracksOptions {
  audio: number;
  subtitle: number;
}

/**
 * @hidden
 */
export interface VlcPlayerViewNativeProps {
  ref?: React.Ref<VLCPlayerViewRef>;
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
  onPositionChanged?: PositionChangedListener;
  onPaused?: PausedListener;
  onStopped?: StoppedListener;
  onEnded?: EndedListener;
  onRepeat?: RepeatListener;
  onError?: ErrorListener;
  onLoad?: LoadListener;
  onBackground?: BackgroundListener;
}

export type AudioMixingMode =
  | "mixWithOthers"
  | "duckOthers"
  | "auto"
  | "doNotMix";

export interface VlcPlayerViewProps extends ViewProps {
  /**
   * Sets the URI of the media to be played
   */
  uri: string;
  /**
   * Sets subtitle URI and enabled state
   *
   * @example
   * ```tsx
   * <VLCPlayerView
   *   subtitle={{
   *    uri: "file://",
   *    enable: false,
   *   }}
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
   *
   */
  options?: string[];
  /**
   * Controls the player volume. Must be an integer number between `0` and `100`
   *
   * @default 100
   *
   */
  volume?: number;
  /**
   * Sets the player volume to `0`
   *
   * @default false
   *
   */
  mute?: boolean;
  /**
   * Controls the player rate. Must be a float number
   *
   * @default 1
   *
   */
  rate?: number;
  /**
   * Sets the player audio and subtitle tracks, see `VideoInfo` for tracks type
   *
   * @example
   * ```tsx
   * <VLCPlayerView
   *    tracks={{
   *       audio: 1,
   *       subtitle: 2,
   *    }}
   * />
   * ```
   */
  tracks?: TracksOptions;
  /**
   * Controls the player time once created. Must be an integer number in milliseconds
   *
   * @default 0
   *
   */
  time?: number;
  /**
   * Repeats media once playback is ended
   *
   * @default false
   *
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
   * Autoplays media once player is created
   *
   * @default true
   *
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
   * Called after the `PositionChanged` player event
   */
  onPositionChanged?: (event: PositionChanged) => void;
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
   * Called after the player loads the media
   */
  onLoad?: (event: VideoInfo) => void;
  /**
   * Called after the player enters the background
   */
  onBackground?: () => void;
}
