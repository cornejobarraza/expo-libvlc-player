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

        var videoTracks: [[String: Any]] = []

        if let videos = player.videoTrackNames as? [String] {
            if let videoIndexes = player.videoTrackIndexes as? [NSNumber] {
                for (index, name) in videos.enumerated() {
                    let trackId = videoIndexes[index].intValue
                    videoTracks.append([
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
        let length = player.media?.length.intValue
        let tracks = [
            "audio": audioTracks,
            "video": videoTracks,
            "subtitle": subtitleTracks,
        ]
        let seekable = player.isSeekable

        let videoInfo: [String: Any] = [
            "width": Int(video.width),
            "height": Int(video.height),
            "tracks": tracks,
            "aspectRatio": ratio,
            "duration": Double(length ?? -1),
            "seekable": seekable,
        ]

        onLoad(videoInfo)
    }
}
