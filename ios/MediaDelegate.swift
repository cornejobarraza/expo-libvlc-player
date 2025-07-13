import MobileVLCKit

extension LibVlcPlayerView: VLCMediaDelegate {
    func mediaDidFinishParsing(_: VLCMedia) {
        guard let player = mediaPlayer else { return }

        var audioTracks: [[String: Any]] = []

        if let audios = player.audioTrackNames as? [String] {
            if let audioIndexes = player.audioTrackIndexes as? [NSNumber] {
                for (index, name) in audios.enumerated() {
                    let trackId = audioIndexes[index].intValue
                    audioTracks.append([
                        "id": trackId,
                        "name": name,
                    ])
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
}
