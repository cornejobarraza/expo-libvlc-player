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

#### NSLocalNetworkUsageDescription

Starting from iOS 14, you are required to provide a message for the `NSLocalNetworkUsageDescription` key in Info.plist if your app uses the local network directly or indirectly.

It seems the `MobileVLCKit` library powering the VLC Player on iOS makes use of this feature when playing external media from sources such as RTSP streams.

Provide a custom message specifying how your app will make use of the network so your App Store submission is not rejected for this reason, read more about this [here](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy).

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
import { VLCPLayerView } from "expo-libvlc-player";

return (
  <View styles={{ height: videoHeight }}>
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

The `VLCPlayerView` extends React Native `ViewProps` and implements its own:

| Prop               | Description                                                                               | Default  |
| ------------------ | ----------------------------------------------------------------------------------------- | -------- |
| `uri`              | Sets the URI of the media to be played                                                    |          |
| `subtitle`         | Sets subtitle URI and enabled state                                                       |          |
| `options`          | Sets the VLC options to initialize the player with                                        | `[]`     |
| `volume`           | Controls the player volume. Must be an integer number between `0` and `100`               | `100`    |
| `mute`             | Sets the player volume to `0`                                                             | `false`  |
| `rate`             | Controls the player rate. Must be a float number between `0` and `1`                      | `1`      |
| `tracks`           | Sets the player audio and subtitle tracks                                                 |          |
| `time`             | Controls the player time once created. Must be an integer number in milliseconds          | `0`      |
| `repeat`           | Repeats the media once playback is ended                                                  | `false`  |
| `aspectRatio`      | Sets the player aspect ratio. Must be a valid `string`                                    |          |
| `audioMixingMode`  | Determines how the player will interact with other audio playing in the system            | `"auto"` |
| `playInBackground` | Determines whether the player should continue playing after the app enters the background | `false`  |
| `autoplay`         | Autoplays media once the player is created                                                | `true`   |

#### Callback props

| Prop                | Description                                      | Payload                                                                                                       |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `onBuffering`       | Called after the `Buffering` player event        |                                                                                                               |
| `onPlaying`         | Called after the `Playing` player event          |                                                                                                               |
| `onPaused`          | Called after the `Paused` player event           | `{ background: boolean }`                                                                                     |
| `onStopped`         | Called after the `Stopped` player event          |                                                                                                               |
| `onPositionChanged` | Called after the `PositionChanged` player event  | `{ position: number }`                                                                                        |
| `onEnded`           | Called after the `EndReached` player event       |                                                                                                               |
| `onRepeat`          | Called after the player repeats the media        |                                                                                                               |
| `onError`           | Called after the `EncounteredError` player event | `{ error: string }`                                                                                           |
| `onLoad`            | Called after the player loads the media        | `{ width: number, height: number, aspectRatio: string, duration: number, tracks: object, seekable: boolean }` |

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
