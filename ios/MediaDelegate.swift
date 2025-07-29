import MobileVLCKit

extension LibVlcPlayerView: VLCMediaDelegate {
    func mediaDidFinishParsing(_: VLCMedia) {
        guard let player = mediaPlayer else { return }

        var audioTracks: [Track] = []

        if let audios = player.audioTrackNames as? [String] {
            if let audioIndexes = player.audioTrackIndexes as? [NSNumber] {
                for (index, trackName) in audios.enumerated() {
                    let trackId = audioIndexes[index].intValue
                    let track = Track(id: trackId, name: trackName)
                    audioTracks.append(track)
                }
            }
        }

        var videoTracks: [Track] = []

        if let videos = player.videoTrackNames as? [String] {
            if let videoIndexes = player.videoTrackIndexes as? [NSNumber] {
                for (index, trackName) in videos.enumerated() {
                    let trackId = videoIndexes[index].intValue
                    let track = Track(id: trackId, name: trackName)
                    videoTracks.append(track)
                }
            }
        }

        var subtitleTracks: [Track] = []

        if let subtitles = player.videoSubTitlesNames as? [String] {
            if let subtitleIndexes = player.videoSubTitlesIndexes as? [NSNumber] {
                for (index, trackName) in subtitles.enumerated() {
                    let trackId = subtitleIndexes[index].intValue
                    let track = Track(id: trackId, name: trackName)
                    subtitleTracks.append(track)
                }
            }
        }

        let video = player.videoSize
        let tracks = [
            "audio": audioTracks,
            "video": videoTracks,
            "subtitle": subtitleTracks,
        ]
        let ratio = player.videoAspectRatio
        let length = player.media?.length.intValue ?? 0
        let seekable = player.isSeekable

        let mediaInfo: [String: Any] = [
            "width": Int(video.width),
            "height": Int(video.height),
            "tracks": tracks,
            "aspectRatio": ratio,
            "duration": Double(length),
            "seekable": seekable,
        ]

        onParsedChanged(mediaInfo)

        videoLength = length
    }
}
