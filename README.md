<p align="center">
     <img alt="VLC icon" src="https://images.videolan.org/images/VLC-IconSmall.png">
</p>

<h1 align="center">LibVLC Player for Expo</h1>

<p align="center">
     <a href="https://www.npmjs.com/package/expo-libvlc-player" target="_blank">
          <img alt="npm version" src="https://img.shields.io/npm/v/expo-libvlc-player">
     </a>
</p>

### Supported versions

| Platform     | Version |
| ------------ | ------- |
| React Native | 0.79    |
| Android      | 7+      |
| iOS          | 15.1+   |

### Installation

Add the package to your npm dependencies

```
npm install expo-libvlc-player
```

### Bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured](https://docs.expo.dev/bare/installing-expo-modules/) the `expo` package before continuing.

### Configure for Android

No additional configuration necessary.

#### Black screen issue

On Android the `libvlcjni` player detaches from the View when its surface is destroyed after switching to a different screen.

This causes nothing to be displayed when coming back to the player screen due to resources being previously released.

As a workaround the View is attached to the player when its surface is created again but causes a brief black screen.

### Configure for iOS

Run `npx pod-install` after installing the npm package.

#### Local network usage

Starting from iOS 14 you are required to provide a message for the `NSLocalNetworkUsageDescription` key in the Info.plist file if your app uses the local network directly or indirectly.

It seems the `MobileVLCKit` player on iOS makes use of this feature when playing external media from sources such as RTSP streams.

Provide a custom message specifying how your app will make use of the network so your App Store submission is not rejected for this reason. Read more about this [here](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy).

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
          "supportsBackgroundPlayback": true
        }
      ]
    ]
  }
}
```

#### Configurable properties

| Name                         | Description                                                                                                                                                                                                                  | Default                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `localNetworkPermission`     | A string to set the `NSLocalNetworkUsageDescription` permission message on iOS                                                                                                                                               | `"Allow $(PRODUCT_NAME) to access your local network"` |
| `supportsBackgroundPlayback` | A boolean value to enable background playback on iOS. If `true`, the `audio` key is added to the `UIBackgroundModes` array in the Info.plist file. If `false`, the key is removed. When `undefined`, the key is not modified | `undefined`                                            |

## Usage

```tsx
import { LibVlcPlayerView } from "expo-libvlc-player";

return (
  <LibVlcPlayerView
    style={{ height: "100%" }}
    source="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  />
);
```

See the [Example App](<example/app/(tabs)/index.tsx>) for additional usage.

### Player methods

| Method    | Description                                                                 | Params             |
| --------- | --------------------------------------------------------------------------- | ------------------ |
| `play()`  | Starts playback of the current player                                       |                    |
| `pause()` | Pauses playback of the current player                                       |                    |
| `stop()`  | Stops playback of the current player                                        |                    |
| `seek()`  | Changes position of the current player. Must be a float between `0` and `1` | `position: number` |

### Player props

The `LibVlcPlayerView` extends React Native `ViewProps` and implements its own:

| Prop               | Description                                                                         | Default  |
| ------------------ | ----------------------------------------------------------------------------------- | -------- |
| `source`           | Sets the source of the media to be played                                           |          |
| `options`          | Sets the VLC options to initialize the player with                                  | `[]`     |
| `slaves`           | Sets the player audio and subtitle slaves. See [`Slave`](#slave) for more           |          |
| `tracks`           | Sets the player audio, video and subtitle tracks. See [`Tracks`](#tracks) for more  |          |
| `volume`           | Sets the player volume. Must be an integer between `0` and `100`                    | `100`    |
| `mute`             | Sets the player volume to `0` when `true`                                           | `false`  |
| `rate`             | Sets the player rate. Must be a float between `0` and `1`                           | `1`      |
| `time`             | Sets the initial player time. Must be an integer in milliseconds                    | `0`      |
| `repeat`           | Determines whether the player should repeat the media after playback ends           | `false`  |
| `aspectRatio`      | Sets the player aspect ratio. Must be a valid format                                |          |
| `audioMixingMode`  | Determines how the player will interact with other audio playing in the system      | `"auto"` |
| `playInBackground` | Determines whether the player should continue playing after entering the background | `false`  |
| `autoplay`         | Determines whether the media should autoplay once created                           | `true`   |

#### Callback props

| Prop                 | Description                                      | Payload                   |
| -------------------- | ------------------------------------------------ | ------------------------- |
| `onBuffering`        | Called after the `Buffering` player event        |                           |
| `onPlaying`          | Called after the `Playing` player event          |                           |
| `onPaused`           | Called after the `Paused` player event           |                           |
| `onStopped`          | Called after the `Stopped` player event          |                           |
| `onEndReached`       | Called after the `EndReached` player event       |                           |
| `onEncounteredError` | Called after the `EncounteredError` player event | `{ error: string }`       |
| `onPositionChanged`  | Called after the `PositionChanged` player event  | `{ position: number }`    |
| `onParsedChanged`    | Called after the `ParsedChanged` media event     | [`MediaInfo`](#mediainfo) |
| `onBackground`       | Called after the player enters the background    |                           |

### Player types

#### `Slave`

```json
{
  "source": "file://path/to/subtitle.srt",
  "type": "subtitle"
}
```

#### `Tracks`

```json
{
  "audio": 1,
  "video": 2,
  "subtitle": -1
}
```

#### `MediaInfo`

```json
{
  "width": 320,
  "height": 176,
  "tracks": {
    "audio": [
      { "id": -1, "name": "Disable" },
      { "id": 1, "name": "English 5.1 Surround - [English]" }
    ],
    "video": [
      { "id": -1, "name": "Disable" },
      { "id": 2, "name": "Track 1" }
    ],
    "subtitle": [
      { "id": -1, "name": "Disable" },
      { "id": 3, "name": "Track 1 - [Japanese]" }
    ]
  },
  "aspectRatio": "16:9",
  "duration": 78920,
  "seekable": true
}
```

## Disclaimer

**IMPORTANT:** This project is not affiliated with, endorsed by, or officially supported by VideoLAN or the VLC media player project.

The VLC logo and cone icon are trademarks of VideoLAN and are used here solely to indicate compatibility with the following VLC libraries:

- `libvlcjni v3.6.2` for Android
- `MobileVLCKit v3.6.0` for iOS

This is an independent open-source implementation that provides React Native bindings for VLC's underlying media libraries.

For official VLC products and support, please visit [videolan.org](https://www.videolan.org/).

## Credits

This project is heavily inspired by existing libraries such as [expo-video](https://github.com/expo/expo/tree/main/packages/expo-video) and [react-native-vlc-media-player](https://github.com/razorRun/react-native-vlc-media-player).

## Contributing

Contributions are always welcome. Please raise any issues and/or fix them by creating a pull request.

### TODO

- [ ] Recording and snapshot support
