const DEFAULT_ASPECT_RATIO = 1 / 1;

export function convertAspectRatio(ratio?: string | null): number {
  if (typeof ratio === "string") {
    const values = ratio.split(":");

    if (values.length === 2) {
      const [width, height] = values.map(Number);

      if (width > 0 && height > 0) {
        return width / height;
      }
    }
  }

  return DEFAULT_ASPECT_RATIO;
}
