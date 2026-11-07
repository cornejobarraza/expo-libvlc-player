import { type LibVlcPlayerViewProps, type PlayerProps } from "../LibVlcPlayerView.types";

type KeyMap<T> = Record<keyof T, true>;

type Keys<T> = (keyof T)[];

function keysOf<T>(keyMap: KeyMap<T>) {
  return Object.keys(keyMap) as Keys<T>;
}

export const PLAYER_PROP_KEYS = keysOf<PlayerProps>({
  source: true,
  metadata: true,
  options: true,
  slaves: true,
  tracks: true,
  delays: true,
  scale: true,
  contentFit: true,
  rate: true,
  time: true,
  volume: true,
  mute: true,
  repeat: true,
  autoplay: true,
  audioMixingMode: true,
  playInBackground: true,
  pictureInPicture: true,
});

function pickKeys<T extends object, K extends keyof T>(object: T, keys: readonly K[]) {
  return Object.fromEntries(keys.map((key) => [key, object[key]])) as Pick<T, K>;
}

export function convertPlayerProps(props: LibVlcPlayerViewProps): PlayerProps {
  return pickKeys(props, PLAYER_PROP_KEYS);
}
