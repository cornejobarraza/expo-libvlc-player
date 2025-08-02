import MobileVLCKit

extension LibVlcPlayerView: VLCMediaDelegate {
    func mediaDidFinishParsing(_: VLCMedia) {
        guard let player = mediaPlayer else { return }

        var audioTracks = []

        if let audios = player.audioTrackNames as? [String] {
            if let audioIndexes = player.audioTrackIndexes as? [NSNumber] {
                for (index, trackName) in audios.enumerated() {
                    let trackId = audioIndexes[index].intValue
                    let track = Track(id: trackId, name: trackName)
                    audioTracks.append(track)
                }
            }
        }

        var videoTracks = []

        if let videos = player.videoTrackNames as? [String] {
            if let videoIndexes = player.videoTrackIndexes as? [NSNumber] {
                for (index, trackName) in videos.enumerated() {
                    let trackId = videoIndexes[index].intValue
                    let track = Track(id: trackId, name: trackName)
                    videoTracks.append(track)
                }
            }
        }

        var subtitleTracks = []

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
        let tracks = MediaTracks(
            audio: audioTracks,
            video: videoTracks,
            subtitle: subtitleTracks,
        )
        let length = player.media?.length.intValue ?? 0
        let seekable = player.isSeekable

        let mediaInfo = MediaInfo(
            width: Int(video.width),
            height: Int(video.height),
            tracks: tracks,
            duration: Double(length),
            seekable: seekable,
        )

        onParsedChanged(mediaInfo)

        mediaLength = length
    }
}
