const DEFAULT_ASPECT_RATIO = 1 / 1;

export function convertAspectRatio(ratio?: string): number {
  if (ratio !== undefined) {
    const numbers = ratio.split(":");

    if (numbers.length === 2) {
      const [width, height] = numbers.map(Number);

      if (width > 0 && height > 0) {
        return width / height;
      }
    }
  }

  return DEFAULT_ASPECT_RATIO;
}
