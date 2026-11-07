import { type LibVlcPlayerViewProps, type PlayerProps } from "../../LibVlcPlayerView.types";
import { convertPlayerProps, PLAYER_PROP_KEYS } from "../props";

const PLAYER_PROPS = {
  source: "https://example.com/video.mp4",
  metadata: { title: "Big Buck Bunny" },
  options: ["--network-caching=1000"],
  slaves: [{ source: "https://example.com/audio.mp3", type: "audio" }],
  tracks: { audio: 1 },
  delays: { subtitle: 1_000_000 },
  scale: 2,
  contentFit: "cover",
  rate: 1.5,
  time: 30_000,
  volume: 50,
  mute: true,
  repeat: true,
  autoplay: false,
  audioMixingMode: "duckOthers",
  playInBackground: true,
  pictureInPicture: true,
} satisfies Required<PlayerProps>;

const PROPS: LibVlcPlayerViewProps = {
  ...PLAYER_PROPS,
  aspectRatio: "auto",
  fallbackRatio: "16:9",
  style: { width: 200 },
  testID: "player",
  onPlaying: () => {},
};

describe("PLAYER_PROP_KEYS", () => {
  it("lists every player prop once", () => {
    expect(PLAYER_PROP_KEYS).toEqual(Object.keys(PLAYER_PROPS));
  });
});

describe(convertPlayerProps, () => {
  it("keeps every player prop and drops the rest", () => {
    expect(convertPlayerProps(PROPS)).toStrictEqual(PLAYER_PROPS);
  });

  it("keeps unset player props as undefined", () => {
    expect(convertPlayerProps({ source: null, volume: 50 })).toStrictEqual({
      ...Object.fromEntries(PLAYER_PROP_KEYS.map((key) => [key, undefined])),
      source: null,
      volume: 50,
    });
  });
});
