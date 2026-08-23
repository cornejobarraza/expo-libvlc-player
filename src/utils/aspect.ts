import { type VideoAspectRatio } from "../LibVlcPlayer.types";

export function convertAspectRatio(ratio?: VideoAspectRatio) {
  if (typeof ratio === "string") {
    const [sWidth, sHeight] = ratio.split(":");

    if (sWidth !== undefined && sHeight !== undefined) {
      const width = Number(sWidth);
      const height = Number(sHeight);

      if (width > 0 && height > 0) {
        return width / height;
      }
    }
  }

  return ratio;
}
