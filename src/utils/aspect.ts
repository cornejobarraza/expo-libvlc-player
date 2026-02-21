import { VideoAspectRatio } from "../LibVlcPlayer.types";

export function convertAspectRatio(
  ratio?: VideoAspectRatio,
): VideoAspectRatio | undefined {
  if (typeof ratio === "string") {
    const numbers = ratio.split(":");

    if (numbers.length === 2) {
      const [width, height] = numbers.map(Number);

      if (width > 0 && height > 0) {
        return width / height;
      }
    }
  }

  return ratio;
}
