import type { ViewProps } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/consistent-type-definitions
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
   * @param value - Must be a double equal or greater than `0`
   * @param type - Defaults to `"time"`
   *
   * @returns A promise which resolves to `void`
   */
  readonly seek: (value: number, type?: "time" | "position") => Promise<void>;
  /**
   * Starts or stops recording the current media
   *
   * @param path - Must be a valid directory or `undefined` to stop recording
   *
   * @returns A promise which resolves to `void`
   */
  readonly record: (path?: string) => Promise<void>;
  /**
   * Takes a snapshot of the current media
   *
   * @param path - Must be a valid directory
   *
   * @returns A promise which resolves to `void`
   */
  readonly snapshot: (path: string) => Promise<void>;
  /**
   * Posts an answer to a `Dialog`
   *
   * @param action - Must be either `1` or `2`
   *
   * @returns A promise which resolves to `void`
   */
  readonly postAction: (action: 1 | 2) => Promise<void>;
  /**
   * Posts a username and password to a login `Dialog`
   *
   * @param username - Must be a valid username, can't be empty
   * @param password - Must be a valid password, can be empty
   * @param store - If `true`, store the credentials
   *
   * @returns A promise which resolves to `void`
   */
  readonly postLogin: (username: string, password: string, store?: boolean) => Promise<void>;
  /**
   * Dismisses a `Dialog`
   *
   * @returns A promise which resolves to `void`
   */
  readonly dismiss: () => Promise<void>;
  /**
   * Enters Picture-in-Picture (PiP) mode
   *
   * @note Config plugin has to be configured for Picture-in-Picture (PiP) to work
   *
   * @returns A promise which resolves to `void`
   */
  readonly startPictureInPicture: () => Promise<void>;
  /**
   * Exits Picture-in-Picture (PiP) mode
   *
   * @platform ios
   *
   * @returns A promise which resolves to `void`
   */
  readonly stopPictureInPicture: () => Promise<void>;
}

export type LibVlcSource = string | number | null;

export type LibVlcSlaveSource = string | number;

export interface Tracks {
  audio?: number;
  video?: number;
  subtitle?: number;
}

export interface Slave {
  source: LibVlcSlaveSource;
  type: "audio" | "subtitle";
  selected?: boolean;
}

export type VideoAspectRatio = "auto" | (string & {}) | number;

export type VideoContentFit = "contain" | "cover" | "fill";

export type AudioMixingMode = "mixWithOthers" | "duckOthers" | "auto" | "doNotMix";

export interface NativeEventProps {
  target: number;
}

export interface NativeEvent<T> {
  nativeEvent: T & NativeEventProps;
}

export type LibVlcEvent<T> = Omit<T & NativeEventProps, "target">;

export interface Error {
  message: string;
}

export interface Time {
  value: number;
}

export interface Position {
  value: number;
}

export interface Snapshot {
  path: string;
}

export interface Dialog {
  title: string;
  text: string;
  type: "error" | "login" | "question";
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
type EncounteredErrorListener = (event: NativeEvent<Error>) => void;

/**
 * @hidden
 */
type TimeChangedListener = (event: NativeEvent<Time>) => void;

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
type PictureInPictureStartListener = () => void;

/**
 * @hidden
 */
type PictureInPictureStopListener = () => void;

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
  aspectRatio?: VideoAspectRatio;
  contentFit?: VideoContentFit;
  rate?: number;
  time?: number;
  volume?: number;
  mute?: boolean;
  audioMixingMode?: AudioMixingMode;
  repeat?: boolean;
  autoplay?: boolean;
  pictureInPicture?: boolean;
  onBuffering?: BufferingListener;
  onPlaying?: PlayingListener;
  onPaused?: PausedListener;
  onStopped?: StoppedListener;
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
  onPictureInPictureStart?: PictureInPictureStartListener;
  onPictureInPictureStop?: PictureInPictureStopListener;
}

export interface LibVlcPlayerViewProps extends ViewProps {
  /**
   * Allows getting a ref to the component instance.
   *
   * Once the component unmounts, React will set `ref.current` to `null`
   *
   * @see {@link https://react.dev/learn/referencing-values-with-refs#refs-and-the-dom React Docs}
   */
  ref: React.RefObject<LibVlcPlayerViewRef | null>;
  /**
   * Sets the source of the media to be played. Set to `null` to release the player
   *
   * @example
   *
   * ```tsx
   * const BIG_BUCK_BUNNY =
   *   "https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov";
   *
   * <LibVlcPlayerView source={BIG_BUCK_BUNNY} />
   * ```
   */
  source: LibVlcSource;
  /**
   * Sets the options to initialize the media with
   *
   * @see {@link https://wiki.videolan.org/VLC_command-line_help/ VideoLAN Wiki}
   *
   * @example
   *
   * ```tsx
   * const options = ["--network-caching=1000"];
   *
   * <LibVlcPlayerView
   *   source={BIG_BUCK_BUNNY}
   *   options={options}
   * />
   * ```
   *
   * @default []
   */
  options?: string[];
  /**
   * Sets the player audio, video and subtitle tracks
   *
   * @example
   *
   * ```tsx
   * const tracks = {
   *   audio: -1,
   *   video: 1,
   *   subtitle: 1,
   * };
   *
   * <LibVlcPlayerView
   *   source={BIG_BUCK_BUNNY}
   *   tracks={tracks}
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
   *
   * ```tsx
   * const slaves = [
   *   {
   *     source: "file://path/to/subtitle.srt",
   *     type: "subtitle",
   *     selected: true,
   *   },
   * ];
   *
   * <LibVlcPlayerView
   *   source={BIG_BUCK_BUNNY}
   *   slaves={slaves}
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
   * Sets the container aspect ratio. Must be a valid ratio, float, or `"auto"`
   *
   * @example "16:9"
   *
   * @default undefined
   */
  aspectRatio?: VideoAspectRatio;
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
   * Sets the initial player time. Must be an integer (ms) greater than `0`
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
   * Sets the player volume to `0` when `true` and previous value is restored when `false`
   *
   * @default false
   */
  mute?: boolean;
  /**
   * Determines how the player will interact with other audio playing in the system
   *
   * @example "doNotMix"
   *
   * @default "auto"
   */
  audioMixingMode?: AudioMixingMode;
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
   * Determines whether the player should allow Picture-in-Picture (PiP) mode
   *
   * @default false
   */
  pictureInPicture?: boolean;
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
  /**
   * Called after the player enters Picture-in-Picture (PiP) mode
   */
  onPictureInPictureStart?: () => void;
  /**
   * Called after the player exits Picture-in-Picture (PiP) mode
   */
  onPictureInPictureStop?: () => void;
}
