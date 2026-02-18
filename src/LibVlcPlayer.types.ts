import type { ViewProps } from "react-native";

export type LibVlcPlayerModuleEvents = {};

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
   * Sets the time or position of the current player
   *
   * @param value - Must be a number equal or greater than `0`
   * @param type - Defaults to `"time"`
   *
   * @returns A promise which resolves to `void`
   */
  readonly seek: (value: number, type?: "time" | "position") => Promise<void>;
  /**
   * Starts or stops recording the current media
   *
   * @param path - Must be a valid string or `undefined` to stop recording
   *
   * @returns A promise which resolves to `void`
   */
  readonly record: (path?: string) => Promise<void>;
  /**
   * Takes a snapshot of the current media
   *
   * @param path - Must be a valid string
   *
   * @returns A promise which resolves to `void`
   */
  readonly snapshot: (path: string) => Promise<void>;
  /**
   * Posts an answer to a `Dialog`
   *
   * @param action - Must be an integer of `1` or `2`
   *
   * @returns A promise which resolves to `void`
   */
  readonly postAction: (action: 1 | 2) => Promise<void>;
  /**
   * Dismisses a `Dialog`
   *
   * @returns A promise which resolves to `void`
   */
  readonly dismiss: () => Promise<void>;
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

export type VideoContentFit = "contain" | "cover" | "fill";

export type AudioMixingMode =
  | "mixWithOthers"
  | "duckOthers"
  | "auto"
  | "doNotMix";

export interface NativeEventProps {
  target: number;
}

export interface NativeEvent<T> {
  nativeEvent: T & NativeEventProps;
}

export type LibVlcEvent<T> = Omit<T & NativeEventProps, "target">;

export interface Dialog {
  title: string;
  text: string;
  cancelText?: string;
  action1Text?: string;
  action2Text?: string;
}

export interface Recording {
  path: string | null;
  isRecording: boolean;
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

/**
 * @hidden
 */
type BufferingListener = () => void;

/**
 * @hidden
 */
type PlayingListener = () => void;

/**
 * @hidden
 */
type PausedListener = () => void;

/**
 * @hidden
 */
type StoppedListener = () => void;

/**
 * @hidden
 */
type EndReachedListener = () => void;

export type Error = { error: string };

/**
 * @hidden
 */
type EncounteredErrorListener = (event: NativeEvent<Error>) => void;

export type Time = { time: number };

/**
 * @hidden
 */
type TimeChangedListener = (event: NativeEvent<Time>) => void;

export type Position = { position: number };

/**
 * @hidden
 */
type PositionChangedListener = (event: NativeEvent<Position>) => void;

/**
 * @hidden
 */
type ESAddedListener = (event: NativeEvent<MediaTracks>) => void;

/**
 * @hidden
 */
type RecordChangedListener = (event: NativeEvent<Recording>) => void;

export type Snapshot = { path: string };

/**
 * @hidden
 */
type SnapshotTakenListener = (event: NativeEvent<Snapshot>) => void;

/**
 * @hidden
 */
type DialogDisplayListener = (event: NativeEvent<Dialog>) => void;

/**
 * @hidden
 */
type FirstPlayListener = (event: NativeEvent<MediaInfo>) => void;

/**
 * @hidden
 */
type ForegroundListener = () => void;

/**
 * @hidden
 */
type BackgroundListener = () => void;

/**
 * @hidden
 */
export interface LibVlcPlayerViewNativeProps extends ViewProps {
  ref?: React.Ref<LibVlcPlayerViewRef>;
  source?: LibVlcSource;
  options?: string[];
  tracks?: Tracks;
  slaves?: Slave[];
  scale?: number;
  aspectRatio?: string | null;
  contentFit?: VideoContentFit;
  rate?: number;
  time?: number;
  volume?: number;
  mute?: boolean;
  audioMixingMode?: AudioMixingMode;
  playInBackground?: boolean;
  repeat?: boolean;
  autoplay?: boolean;
  onBuffering?: BufferingListener;
  onPlaying?: PlayingListener;
  onPaused?: PausedListener;
  onStopped?: StoppedListener;
  onEndReached?: EndReachedListener;
  onEncounteredError?: EncounteredErrorListener;
  onDialogDisplay?: DialogDisplayListener;
  onTimeChanged?: TimeChangedListener;
  onPositionChanged?: PositionChangedListener;
  onESAdded?: ESAddedListener;
  onRecordChanged?: RecordChangedListener;
  onSnapshotTaken?: SnapshotTakenListener;
  onFirstPlay?: FirstPlayListener;
  onForeground?: ForegroundListener;
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
   * Sets how the video should be scaled to fit in the container
   *
   * @example "cover"
   *
   * @default "contain"
   */
  contentFit?: VideoContentFit;
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
   * Determines whether the media should continue playing in the background
   *
   * @note Battery optimization must be disabled on Android
   *
   * @default false
   */
  playInBackground?: boolean;
  /**
   * Determines whether the media should repeat once ended
   *
   * @default false
   */
  repeat?: boolean;
  /**
   * Determines whether the media should autoplay once created
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
  onEndReached?: () => void;
  /**
   * Called after the `EncounteredError` player event
   */
  onEncounteredError?: (event: Error) => void;
  /**
   * Called after a `Dialog` needs to be displayed
   */
  onDialogDisplay?: (event: Dialog) => void;
  /**
   * Called after the `TimeChanged` player event
   */
  onTimeChanged?: (event: Time) => void;
  /**
   * Called after the `PositionChanged` player event
   */
  onPositionChanged?: (event: Position) => void;
  /**
   * Called after the `ESAdded` player event
   */
  onESAdded?: (event: MediaTracks) => void;
  /**
   * Called after the `RecordChanged` player event
   */
  onRecordChanged?: (event: Recording) => void;
  /**
   * Called after a media snapshot is taken
   */
  onSnapshotTaken?: (event: Snapshot) => void;
  /**
   * Called after the player first playing event
   */
  onFirstPlay?: (event: MediaInfo) => void;
  /**
   * Called after the player enters the foreground
   */
  onForeground?: () => void;
  /**
   * Called after the player enters the background
   */
  onBackground?: () => void;
}
