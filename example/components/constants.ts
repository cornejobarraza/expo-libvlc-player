import { isDevice } from "expo-device";

import { type IdMapping, type SymbolMapping } from "./types";

export const PLAYER_MIN_VOLUME = 0;
export const PLAYER_MAX_VOLUME = 100;
export const PLAYER_VOLUME_STEP = 10;

export const PLAYER_MAX_BUFFER = 100;
export const PLAYER_DEFAULT_TIME = 0;
export const PLAYER_SEEK_STEP = 10_000;

export const PLAYER_OPTIONS = !isDevice ? [":codec=avcodec"] : undefined;
export const PLAYER_ASPECT_RATIO = "16/9";
export const PLAYER_CONTENT_FIT = "contain";

export const CONTROL_ICON_SIZE = 24;
export const CONTROL_PADDING_VERTICAL = 4;
export const CONTROL_PADDING_HORIZONTAL = 8;
export const CONTROL_BORDER_RADIUS = 4;

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
