<p align="center">
     <img src="https://images.videolan.org/images/VLC-IconSmall.png" alt="VLC icon">
</p>

<h1 align="center">LibVLC Player for Expo</h1>

### Installation

Add the package to your npm dependencies

```
npm install expo-libvlc-player
```

### Bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured](https://docs.expo.dev/bare/installing-expo-modules/) the `expo` package before continuing.

### Configure for Android

No additional configuration necessary.

### Configure for iOS

Run `npx pod-install` after installing the npm package.

## Usage

```tsx
import { VLCPLayerView } from "expo-libvlc-player";

return (
  <View styles={{ height: 576 }}>
    <VLCPlayerView
      style={{ height: "100%" }}
      uri="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    />
  </View>
);
```

See the [example app](example/App.tsx) for additional usage.

### Player methods

| Method    | Description                           | Params                                              |
| --------- | ------------------------------------- | --------------------------------------------------- |
| `play()`  | Starts playback of the current player |                                                     |
| `pause()` | Pauses playback of the current player |                                                     |
| `stop()`  | Stops playback of the current player  |                                                     |
| `seek()`  | Sets position of the current player   | `position` - Must be a float number between 0 and 1 |

### Player props

The `VLCPlayerView` extends React Native `ViewProps` and implements it's own:

| Prop               | Description                                                                               | Default  |
| ------------------ | ----------------------------------------------------------------------------------------- | -------- |
| `uri`              | Sets the URI of the media to be played                                                    |          |
| `subtitle`         | Sets subtitle URI and enabled state                                                       |          |
| `options`          | Sets the VLC options to initialize the player with                                        | `[]`     |
| `volume`           | Controls the player volume, must be an integer number between `0` and `100`               | `100`    |
| `mute`             | Sets the player volume to `0`                                                             | `false`  |
| `rate`             | Controls the player rate, must be a float number between `0` and `1`                      | `1`      |
| `tracks`           | Sets the player audio and subtitle tracks                                                 |          |
| `repeat`           | Repeats the media once playback is ended                                                  | `false`  |
| `aspectRatio`      | Sets the player aspect ratio, must be a valid `string`                                    |          |
| `audioMixingMode`  | Determines how the player will interact with other audio playing in the system            | `"auto"` |
| `playInBackground` | Determines whether the player should continue playing after the app enters the background | `false`  |
| `autoplay`         | Autoplays media once player is created                                                    | `true`   |

#### Callback props

| Prop                | Description                                      | Payload                                                                                                       |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `onBuffering`       | Called after the `Buffering` player event        |                                                                                                               |
| `onPlaying`         | Called after the `Playing` player event          |                                                                                                               |
| `onPaused`          | Called after the `Paused` player event           |                                                                                                               |
| `onStopped`         | Called after the `Stopped` player event          |                                                                                                               |
| `onPositionChanged` | Called after the `PositionChanged` player event  | `{ position: number }`                                                                                        |
| `onEnded`           | Called after the `EndReached` player event       |                                                                                                               |
| `onRepeat`          | Called after the player repeats the media        |                                                                                                               |
| `onWarn`            | Called after the player encounters a conflict    | `{ warn: string }`                                                                                            |
| `onError`           | Called after the `EncounteredError` player event | `{ error: string }`                                                                                           |
| `onLoad`            | Called after the `Buffering` player event        | `{ width: number, height: number, aspectRatio: string, duration: number, tracks: object, seekable: boolean }` |
| `onBackground`      | Called after the player enters the background    |                                                                                                               |

## Disclaimer

**IMPORTANT:** This project is not affiliated with, endorsed by, or officially supported by VideoLAN or the VLC media player project.

The VLC logo and cone icon are trademarks of VideoLAN and are used here solely to indicate compatibility with the following VLC libraries:

- `LibVLC v3.6.2` for Android
- `MobileVLCKit v3.6.0` for iOS

This is an independent open-source implementation that provides React Native bindings for VLC's underlying media libraries.

For official VLC products and support, please visit [videolan.org](https://www.videolan.org/).

### Credits

This project is heavily inspired by existing libraries such as [expo-video](https://github.com/expo/expo/tree/main/packages/expo-video) and [react-native-vlc-media-player](https://github.com/razorRun/react-native-vlc-media-player).

## Contributing

Contributions are always welcome. Please raise any issues and/or fix them by creating a pull request.
