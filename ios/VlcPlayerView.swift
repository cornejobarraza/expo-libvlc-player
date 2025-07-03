import AVFoundation
import ExpoModulesCore
import MobileVLCKit

let defaultPlayerRate: Float = 1.0
let minPlayerVolume: Int = 0
let maxPlayerVolume: Int = 100
let playerVolumeStep: Int = 10

private let useTextureViews = false
private let enableSubtitles = true

class VlcPlayerView: ExpoView, VLCMediaPlayerDelegate {
    var mediaPlayer: VLCMediaPlayer?
    var shouldCreate: Bool = false

    private var uri: String = ""
    private var options: [String] = []
    private var userVolume: Int = maxPlayerVolume
    private var shouldRepeat: Bool = false
    var audioMixingMode: AudioMixingMode = .auto
    var playInBackground: Bool = false
    private var autoplay: Bool = true

    private let onBuffering = EventDispatcher()
    private let onPlaying = EventDispatcher()
    private let onPaused = EventDispatcher()
    private let onStopped = EventDispatcher()
    private let onEnded = EventDispatcher()
    private let onRepeat = EventDispatcher()
    private let onWarn = EventDispatcher()
    private let onError = EventDispatcher()
    private let onPositionChanged = EventDispatcher()
    private let onLoad = EventDispatcher()
    let onBackground = EventDispatcher()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        backgroundColor = UIColor.black

        VlcPlayerManager.shared.registerView(view: self)

        clipsToBounds = true
    }

    func createPlayer() {
        if !shouldCreate { return }

        destroyPlayer()

        mediaPlayer = VLCMediaPlayer(options: options)

        if let player = mediaPlayer {
            player.delegate = self
            player.drawable = self

            guard let url = URL(string: uri) else {
                let error = ["error": "Invalid URI, media could not be set"]
                onError(error)
                return
            }

            player.media = VLCMedia(url: url)

            if autoplay {
                player.play()
            }
        }

        shouldCreate = false
    }

    func mediaPlayerStateChanged(_: Notification) {
        guard let player = mediaPlayer else { return }

        switch player.state {
        case .buffering:
            onBuffering([:])

            if player.position == 0.0 {
                var audioTracks: [[String: Any]] = []

                if let audios = player.audioTrackNames as? [String] {
                    if let audioIndexes = player.audioTrackIndexes as? [NSNumber] {
                        for (index, name) in audios.enumerated() {
                            let trackId = audioIndexes[index].intValue
                            if trackId != -1 && name != "Disable" {
                                audioTracks.append([
                                    "id": trackId,
                                    "name": name,
                                ])
                            }
                        }
                    }
                }

                var subtitleTracks: [[String: Any]] = []

                if let subtitles = player.videoSubTitlesNames as? [String] {
                    if let subtitleIndexes = player.videoSubTitlesIndexes as? [NSNumber] {
                        for (index, name) in subtitles.enumerated() {
                            let trackId = subtitleIndexes[index].intValue
                            subtitleTracks.append([
                                "id": trackId,
                                "name": name,
                            ])
                        }
                    }
                }

                let video = player.videoSize
                let ratio = player.videoAspectRatio
                var length = 0
                if let media = player.media {
                    length = Int(media.length.intValue)
                }
                let tracks = [
                    "audio": audioTracks,
                    "subtitle": subtitleTracks,
                ]
                let seekable = player.isSeekable

                let videoInfo: [String: Any] = [
                    "width": Int(video.width),
                    "height": Int(video.height),
                    "aspectRatio": ratio,
                    "duration": Double(length),
                    "tracks": tracks,
                    "seekable": seekable,
                ]

                onLoad(videoInfo)
            }
        case .playing:
            onPlaying([:])
            VlcPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        case .paused:
            onPaused([:])
            VlcPlayerManager.shared.setAppropriateAudioSessionOrWarn()
        case .stopped:
            onStopped([:])
            VlcPlayerManager.shared.setAppropriateAudioSessionOrWarn()

            let position = 0.0
            onPositionChanged(["position": position])
        case .ended:
            onEnded([:])

            let manualRepeat = !options.hasRepeatOptions() && shouldRepeat

            if manualRepeat {
                player.stop()
                player.play()
                onRepeat([:])
            }
        case .error:
            let error = ["error": "Player encountered an error"]
            onError(error)
        default:
            break
        }
    }

    func mediaPlayerPositionChanged(_: Notification) {
        guard let player = mediaPlayer else { return }

        let position = ["position": player.position]
        onPositionChanged(position)
    }

    func destroyPlayer() {
        if let player = mediaPlayer {
            player.stop()
            mediaPlayer = nil
        }
    }

    func setUri(_ uri: String) {
        let old = self.uri
        self.uri = uri

        shouldCreate = uri != old
    }

    func setSubtitle(_ subtitle: [String: Any]?) {
        guard let player = mediaPlayer,
              let subtitle = subtitle,
              !subtitle.isEmpty else { return }

        let uri = subtitle["uri"] as? String ?? ""

        guard let url = URL(string: uri) else {
            let error = ["error": "Invalid URI, subtitle could not be set"]
            onError(error)
            return
        }

        let enable = subtitle["enable"] as? Bool ?? enableSubtitles

        player.addPlaybackSlave(url, type: .subtitle, enforce: enable)
    }

    func setOptions(_ options: [String]) {
        let old = self.options
        self.options = options

        shouldCreate = options != old
    }

    func setVolume(_ volume: Int) {
        guard let player = mediaPlayer else { return }

        let newVolume = max(minPlayerVolume, min(maxPlayerVolume, volume))
        userVolume = newVolume

        player.audio?.volume = Int32(newVolume)
        VlcPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setMute(_ mute: Bool) {
        guard let player = mediaPlayer else { return }

        let newVolume = !mute ?
            max(playerVolumeStep, min(maxPlayerVolume, userVolume)) :
            minPlayerVolume

        player.audio?.volume = Int32(newVolume)
        VlcPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setRate(_ rate: Float) {
        guard let player = mediaPlayer else { return }

        player.rate = rate
    }

    func setTracks(_ tracks: [String: Any]?) {
        guard let player = mediaPlayer,
              let tracks = tracks,
              !tracks.isEmpty else { return }

        let audioTrack = tracks["audio"] as? Int ?? -1
        let subtitleTrack = tracks["subtitle"] as? Int ?? -1

        player.currentAudioTrackIndex = Int32(audioTrack)
        player.currentVideoSubTitleIndex = Int32(subtitleTrack)
    }

    func setRepeat(_ shouldRepeat: Bool) {
        if shouldRepeat && options.hasRepeatOptions() {
            let warn = ["warn": "Repeat already enabled in options"]
            return onWarn(warn)
        }

        self.shouldRepeat = shouldRepeat
    }

    func setAspectRatio(_ aspectRatio: String?) {
        guard let player = mediaPlayer,
              let aspectRatio = aspectRatio else { return }

        if let cString = strdup(aspectRatio) {
            player.videoAspectRatio = cString
            free(cString)
        }
    }

    func setAudioMixingMode(_ audioMixingMode: AudioMixingMode) {
        self.audioMixingMode = audioMixingMode
        VlcPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setPlayInBackground(_ playInBackground: Bool) {
        self.playInBackground = playInBackground
        VlcPlayerManager.shared.setAppropriateAudioSessionOrWarn()
    }

    func setAutoplay(_ autoplay: Bool) {
        self.autoplay = autoplay
    }

    func play() {
        mediaPlayer?.play()
    }

    func pause() {
        mediaPlayer?.pause()
    }

    func stop() {
        mediaPlayer?.stop()
    }

    func seek(_ position: Float) {
        guard let player = mediaPlayer else { return }

        if player.isSeekable {
            player.position = position
        } else {
            let error = ["error": "Media is not seekable"]
            onError(error)
        }
    }

    deinit {
        VlcPlayerManager.shared.unregisterView(view: self)
        destroyPlayer()
    }
}

private extension Array where Element == String {
    func hasRepeatOptions() -> Bool {
        let prefixes: Set<String> = [
            "--input-repeat=", "-input-repeat=", ":input-repeat=",
        ]

        return contains { arg in
            prefixes.contains { prefix in
                arg.hasPrefix(prefix)
            }
        }
    }
}
