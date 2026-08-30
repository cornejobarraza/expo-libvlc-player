<p align="center">
  <img alt="VLC icon" src="example/assets/vlc.png">
</p>

<h1 align="center">LibVLC Player for Expo</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/expo-libvlc-player" target="_blank">
    <img alt="npm version" src="https://img.shields.io/npm/v/expo-libvlc-player">
  </a>
</p>

<p align="center">
  <img alt="Example App" src="example/assets/player.png">
</p>

## Supported versions

| Platform             | Version |
| -------------------- | ------- |
| Expo SDK             | 57+     |
| React Native         | 0.86+   |
| Android / Android TV | 7+      |
| iOS / Apple TV       | 16.4+   |

### Can I use this library with older Expo SDK versions?

Previous versions may be supported by changing how you compile the app.

#### Example app.json with config plugin

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 36,
            "targetSdkVersion": 36,
            "buildToolsVersion": "36.0.0"
          },
          "ios": {
            "deploymentTarget": "16.4"
          }
        }
      ]
    ]
  }
}
```

## Installation

```
npm install expo-libvlc-player
```

### Bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured](https://docs.expo.dev/bare/installing-expo-modules/) the `expo` package.

### Configure for Android

No additional configuration necessary.

### Configure for iOS

Run `npx pod-install` after installing the npm package.

### Configure for TV

Set the `EXPO_TV` environment variable, and run prebuild to make the TV modifications to the project.

```
EXPO_TV=1 npx expo prebuild --clean
```

### Configuration in app config

You can configure `expo-libvlc-player` using its built-in config plugin if you use config plugins in your project.

#### Example app.json with config plugin

```json
{
  "expo": {
    "plugins": [
      [
        "expo-libvlc-player",
        {
          "localNetworkPermission": "Allow $(PRODUCT_NAME) to access your local network",
          "supportsPictureInPicture": true
        }
      ]
    ]
  }
}
```

#### Configurable properties

| Name                       | Description                                                                                                                                                                                                                                                                                                                                  | Default                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `localNetworkPermission`   | A string to set the `NSLocalNetworkUsageDescription` permission message on iOS                                                                                                                                                                                                                                                               | `"Allow $(PRODUCT_NAME) to access your local network"` |
| `supportsPictureInPicture` | A boolean to enable Picture-in-Picture (PiP) support. If `true`, it adds the `android:supportsPictureInPicture` property on Android and the `audio` key to the `UIBackgroundModes` array in the Info.plist file on iOS. If `false`, it removes the property on Android and the key on iOS. If `undefined`, the configuration is not modified | `undefined`                                            |

## Usage

Create a basic player:

```tsx
import { LibVlcPlayerView } from "expo-libvlc-player";

return <LibVlcPlayerView source={require("./assets/bbb.mp4")} />;
```

Trigger the local network privacy alert on iOS:

```tsx
import LibVlcPlayerModule from "expo-libvlc-player";

await LibVlcPlayerModule.triggerNetworkAlert();
```

Check for Picture-in-Picture (PiP) support:

```tsx
import LibVlcPlayerModule from "expo-libvlc-player";

LibVlcPlayerModule.isPictureInPictureSupported();
```

See the [Example App](example) for additional usage.

### Module functions

The `LibVlcPlayerModule` implements the following functions:

| Function                        | Description                                                 | Returns         |
| ------------------------------- | ----------------------------------------------------------- | --------------- |
| `triggerNetworkAlert()`         | Attempts to trigger the local network privacy alert on iOS  | `Promise<void>` |
| `isPictureInPictureSupported()` | Checks whether the device supports Picture-in-Picture (PiP) | `boolean`       |

### View functions

The `LibVlcPlayerViewRef` implements the following functions:

| Function                                                         | Description                                                                                                                          | Returns         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| `play()`                                                         | Starts playback of the current player                                                                                                | `Promise<void>` |
| `pause()`                                                        | Pauses playback of the current player                                                                                                | `Promise<void>` |
| `stop()`                                                         | Stops playback of the current player                                                                                                 | `Promise<void>` |
| `seek(value: number, type?: "time" \| "position")`               | Sets the time or position of the current player. Value must be a number equal or greater than `0` and type defaults to time          | `Promise<void>` |
| `record(path?: string)`                                          | Starts or stops recording the current media. Path must be a valid directory or `undefined` to stop recording                         | `Promise<void>` |
| `snapshot(path: string)`                                         | Takes a snapshot of the current media. Path must be a valid directory                                                                | `Promise<void>` |
| `postAction(action: 1 \| 2)`                                     | Posts an answer to a dialog. Action must be either `1` or `2`                                                                        | `Promise<void>` |
| `postLogin(username: string, password: string, store?: boolean)` | Posts a username and password to a login dialog. Username can't be empty, password can be empty and if `true`, store the credentials | `Promise<void>` |
| `dismiss()`                                                      | Dismisses a dialog                                                                                                                   | `Promise<void>` |
| `startPictureInPicture()`                                        | Enters Picture-in-Picture (PiP) mode. Config plugin has to be configured for Picture-in-Picture (PiP) to work                        | `Promise<void>` |
| `stopPictureInPicture()`                                         | Exits Picture-in-Picture (PiP) mode on iOS                                                                                           | `Promise<void>` |

### View props

The `LibVlcPlayerView` extends React Native `ViewProps` and implements the following props:

| Prop               | Description                                                                                                                       | Default     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `source`           | Sets the source of the media to be played, or `null` to release the player. See [`LibVlcSource`](#libvlcsource) for more          |             |
| `options`          | Sets the options to initialize the media with. See the [VideoLAN Wiki](https://wiki.videolan.org/VLC_command-line_help/) for more | `[]`        |
| `tracks`           | Sets the player audio, video, and subtitle track indexes. See [`Tracks`](#tracks) for more                                        | `undefined` |
| `slaves`           | Sets the player audio and subtitle slaves. See [`Slave`](#slave) for more                                                         | `[]`        |
| `delays`           | Sets the player audio and subtitle delay values in microseconds. See [`Delays`](#delays) for more                                 | `undefined` |
| `scale`            | Sets the player scaling factor. Must be a valid number                                                                            | `0`         |
| `aspectRatio`      | Sets the container aspect ratio. Must be a valid ratio, number, or auto. If auto, a fallback ratio must be provided               | `undefined` |
| `fallbackRatio`    | Sets the fallback aspect ratio. Must be a valid ratio or number                                                                   | `undefined` |
| `contentFit`       | Sets how the video should be scaled to fit in the container                                                                       | `"contain"` |
| `rate`             | Sets the player playback rate. Must be a valid number                                                                             | `1`         |
| `time`             | Sets the initial player time in milliseconds. Must be a number equal or greater than `0`                                          | `0`         |
| `volume`           | Sets the player volume. Must be a number between `0` and `100`                                                                    | `100`       |
| `mute`             | Sets the player volume to `0` when `true` and restores previous volume when `false`                                               | `false`     |
| `audioMixingMode`  | Determines how the player will interact with other audio in the system                                                            | `"auto"`    |
| `repeat`           | Determines whether the media should repeat once ended                                                                             | `false`     |
| `autoplay`         | Determines whether the media should autoplay once created                                                                         | `true`      |
| `pictureInPicture` | Determines whether the player should allow Picture-in-Picture (PiP) mode                                                          | `false`     |

#### Callback props

| Prop                      | Description                                                  | Payload                       |
| ------------------------- | ------------------------------------------------------------ | ----------------------------- |
| `onBuffering`             | Called after the `Buffering` player event                    | [`Buffering`](#buffering)     |
| `onPlaying`               | Called after the `Playing` player event                      |                               |
| `onPaused`                | Called after the `Paused` player event                       |                               |
| `onStopped`               | Called after the `Stopped` player event                      |                               |
| `onEncounteredError`      | Called after the `EncounteredError` player event             | [`Error`](#error)             |
| `onDialogDisplay`         | Called after a dialog needs to be displayed                  | [`Dialog`](#dialog)           |
| `onTimeChanged`           | Called after the `TimeChanged` player event                  | [`Time`](#time)               |
| `onPositionChanged`       | Called after the `PositionChanged` player event              | [`Position`](#position)       |
| `onESAdded`               | Called after the `ESAdded` player event                      | [`MediaTracks`](#mediatracks) |
| `onRecordChanged`         | Called after the `RecordChanged` player event                | [`Recording`](#recording)     |
| `onSnapshotTaken`         | Called after a media snapshot is taken                       | [`Snapshot`](#snapshot)       |
| `onFirstPlay`             | Called after the player first playing event                  | [`MediaInfo`](#mediainfo)     |
| `onForeground`            | Called after the player enters the foreground                |                               |
| `onBackground`            | Called after the player enters the background                |                               |
| `onPictureInPictureStart` | Called after the player enters Picture-in-Picture (PiP) mode |                               |
| `onPictureInPictureStop`  | Called after the player exits Picture-in-Picture (PiP) mode  |                               |

### Module types

#### `LibVlcSource`

```ts
type LibVlcSource = string | number | null;
```

#### `Tracks`

```ts
interface Tracks {
  audio?: number;
  video?: number;
  subtitle?: number;
}
```

#### `Slave`

```ts
interface Slave {
  source: string | number;
  type: "audio" | "subtitle";
  selected?: boolean;
}
```

#### `Delays`

```ts
interface Delays {
  audio?: number;
  subtitle?: number;
}
```

#### `Buffering`

```ts
interface Buffering {
  value: number;
}
```

#### `Error`

```ts
interface Error {
  message: string;
}
```

#### `Dialog`

```ts
interface Dialog {
  title: string;
  text: string;
  type: "error" | "login" | "question";
  cancelText?: string;
  action1Text?: string;
  action2Text?: string;
}
```

#### `Time`

```ts
interface Time {
  value: number;
}
```

#### `Position`

```ts
interface Position {
  value: number;
}
```

#### `MediaTrack`

```ts
interface MediaTrack {
  id: number;
  name: string;
}
```

#### `MediaTracks`

```ts
interface MediaTracks {
  audio: MediaTrack[];
  video: MediaTrack[];
  subtitle: MediaTrack[];
}
```

#### `Recording`

```ts
interface Recording {
  path: string | null;
  isRecording: boolean;
}
```

#### `Snapshot`

```ts
interface Snapshot {
  path: string;
}
```

#### `VideoInfo`

```ts
interface VideoInfo {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
}
```

#### `MediaMetadata`

```ts
interface MediaMetadata {
  title?: string;
  artist?: string;
  album?: string;
  artworkURL?: string;
}
```

#### `MediaInfo`

```ts
interface MediaInfo {
  video: VideoInfo;
  metadata: MediaMetadata;
  length: number;
  seekable: boolean;
}
```

## Known issues

#### Black screen

On Android, the `libvlcjni` player detaches from the View after switching screens.

The current workaround attaches the View back to the player but causes a brief black screen.

https://code.videolan.org/videolan/vlc-android/-/issues/1495

On iOS, the `VLCKit` player deselects the video track after pausing in the background.

The current workaround selects the video track back but causes a brief black screen.

https://code.videolan.org/videolan/VLCKit/-/issues/743

#### Local network

On iOS, the `VLCKit` player interacts with the local network to discover media servers by default.

A custom message can be provided for the `NSLocalNetworkUsageDescription` key in the Info.plist file.

https://code.videolan.org/videolan/vlc-ios/-/issues/893

## Contributing

Contributions are always welcome. Please raise any issues or fix them by creating a pull request.

## Development

Install [Ktlint](https://github.com/ktlint/ktlint) and [SwiftFormat](https://github.com/nicklockwood/swiftformat) for linting native code:

```
brew install ktlint swiftformat
```

LibVLC might not render properly on emulators or simulators. Please test on a real device.

## Disclaimer

This project is not affiliated with, endorsed by, or officially supported by VideoLAN. The VLC icon is trademark of VideoLAN and is used here solely to indicate compatibility with the following LibVLC bindings:

- `libvlcjni` for Android / Android TV
- `VLCKit` for iOS / Apple TV

For official VLC products and support, please visit [videolan.org](https://www.videolan.org/).

## Credits

This library is inspired by existing projects such as [react-native-vlc-media-player](https://github.com/razorRun/react-native-vlc-media-player) and [expo-video](https://github.com/expo/expo/tree/main/packages/expo-video).

## License

Made available under the MIT license, as found in the [LICENSE](LICENSE) file.
