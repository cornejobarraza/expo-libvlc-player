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
   * @param position - Must be a float between `0` and `1`
   *
   * @returns A promise which resolves to `void`
   */
  readonly seek: (position: number) => Promise<void>;
}

export type LibVlcSource = string | number | null;

export interface Tracks {
  audio?: number;
  video?: number;
  subtitle?: number;
}

export interface Slave {
  source: NonNullable<LibVlcSource>;
  type: "audio" | "subtitle";
  selected?: boolean;
}

export interface Track {
  id: number;
  name: string;
}

export interface MediaTracks {
  audio: Track[];
  video: Track[];
  subtitle: Track[];
}

export interface MediaInfo {
  width: number;
  height: number;
  length: number;
  seekable: boolean;
  tracks: MediaTracks;
}

export type AudioMixingMode =
  | "mixWithOthers"
  | "duckOthers"
  | "auto"
  | "doNotMix";

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
export type EndReachedListener = () => void;

/**
 * @hidden
 */
export type EncounteredErrorListener = (event: { nativeEvent: Error }) => void;

export type Error = { error: string };

/**
 * @hidden
 */
export type PositionChangedListener = (event: {
  nativeEvent: Position;
}) => void;

export type Position = { position: number };

/**
 * @hidden
 */
export type ESAddedListener = (event: { nativeEvent: MediaTracks }) => void;

/**
 * @hidden
 */
export type FirstPlayListener = (event: { nativeEvent: MediaInfo }) => void;

/**
 * @hidden
 */
export type BackgroundListener = () => void;

/**
 * @hidden
 */
export interface LibVlcPlayerViewNativeProps {
  ref?: React.Ref<LibVlcPlayerViewRef>;
  source?: LibVlcSource;
  options?: string[];
  tracks?: Tracks;
  slaves?: Slave[];
  scale?: number;
  aspectRatio?: string | null;
  rate?: number;
  time?: number;
  volume?: number;
  mute?: boolean;
  audioMixingMode?: AudioMixingMode;
  playInBackground?: boolean;
  autoplay?: boolean;
  repeat?: boolean;
  onBuffering?: BufferingListener;
  onPlaying?: PlayingListener;
  onPaused?: PausedListener;
  onStopped?: StoppedListener;
  onEndReached?: EndReachedListener;
  onEncounteredError?: EncounteredErrorListener;
  onPositionChanged?: PositionChangedListener;
  onESAdded?: ESAddedListener;
  onFirstPlay?: FirstPlayListener;
  onBackground?: BackgroundListener;
}

export interface LibVlcPlayerViewProps extends ViewProps {
  /**
   * Sets the source of the media to be played. Set to `null` to release the player
   */
  source: LibVlcSource;
  /**
   * Sets the VLC options to initialize the player with
   *
   * https://wiki.videolan.org/VLC_command-line_help/
   *
   * @example ["--network-caching=1000"]
   *
   * @default []
   */
  options?: string[];
  /**
   * Sets the player audio, video and subtitle tracks
   *
   * @example
   * ```tsx
   * <LibVlcPlayerView
   *    tracks={{
   *      audio: 0,
   *      video: 1,
   *      subtitle: 2,
   *    }}
   * />
   * ```
   *
   * @default undefined
   */
  tracks?: Tracks;
  /**
   * Sets the player audio and subtitle slaves
   *
   * @example
   * ```tsx
   * <LibVlcPlayerView
   *    slaves={[
   *      {
   *        source: "file://path/to/subtitle.srt",
   *        type: "subtitle",
   *        selected: true
   *      },
   *    ]}
   * />
   * ```
   *
   * @default []
   */
  slaves?: Slave[];
  /**
   * Sets the player scaling factor. Must be a float equal or greater than `0`
   *
   * @default 0
   */
  scale?: number;
  /**
   * Sets the player aspect ratio. Must be a valid string or `null` for default
   *
   * @example "16:9"
   *
   * @default undefined
   */
  aspectRatio?: string | null;
  /**
   * Sets the player rate. Must be a float equal or greater than `1`
   *
   * @default 1
   */
  rate?: number;
  /**
   * Sets the initial player time. Must be an integer in milliseconds
   *
   * @default 0
   */
  time?: number;
  /**
   * Sets the player volume. Must be an integer between `0` and `100`
   *
   * @default 100
   */
  volume?: number;
  /**
   * Sets the player volume to `0` when `true`. Previous value is set when `false`
   *
   * @default false
   */
  mute?: boolean;
  /**
   * Determines how the player will interact with other audio playing in the system
   *
   * @default "auto"
   */
  audioMixingMode?: AudioMixingMode;
  /**
   * Determines whether the player should continue playing after entering the background
   *
   * @default false
   */
  playInBackground?: boolean;
  /**
   * Determines whether the media should autoplay once created
   *
   * @default true
   */
  autoplay?: boolean;
  /**
   * Determines whether the media should repeat once ended
   *
   * @default false
   */
  repeat?: boolean;
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
  onEndReached?: () => void;
  /**
   * Called after the `EncounteredError` player event
   */
  onEncounteredError?: (event: Error) => void;
  /**
   * Called after the `PositionChanged` player event
   */
  onPositionChanged?: (event: Position) => void;
  /**
   * Called after the `ESAdded` player event
   */
  onESAdded?: (event: MediaTracks) => void;
  /**
   * Called after the first `Playing` player event
   */
  onFirstPlay?: (event: MediaInfo) => void;
  /**
   * Called after the player enters the background
   */
  onBackground?: () => void;
}
