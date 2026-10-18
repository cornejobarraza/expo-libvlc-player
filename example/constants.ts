import { isDevice } from "expo-device";

import { type IdMapping, type SymbolMapping } from "./components/types";

export const MIN_VOLUME = 0;
export const MAX_VOLUME = 100;
export const VOLUME_STEP = 10;

export const MAX_BUFFER = 1;
export const DEFAULT_TIME = 0;
export const SEEK_STEP = 10_000;

export const OPTIONS = !isDevice ? [":codec=avcodec"] : undefined;
export const ASPECT_RATIO = "16/9";
export const CONTENT_FIT = "contain";

export const HIDE_DELAY = 3000;

export const CONTROL_IDS = {
  "play.fill": "play",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "forward.fill": "forward",
  "backward.fill": "backward",
  "speaker.1.fill": "speaker.1",
  "speaker.3.fill": "speaker.3",
} as IdMapping;

export const ICON_SYMBOLS = {
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "forward.fill": "fast-forward",
  "backward.fill": "fast-rewind",
  "speaker.1.fill": "volume-down",
  "speaker.3.fill": "volume-up",
} as SymbolMapping;
