import { getThumbnailAsync } from "expo-video-thumbnails";
import { useEffect, useState } from "react";

interface MediaThumbnailProps {
  url: string;
  time: number;
}

export function useMediaThumbnail({ url, time }: MediaThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    generateThumbnail();
  }, []);

  const generateThumbnail = async () => {
    try {
      const { uri } = await getThumbnailAsync(url, { time });
      setThumbnail(uri);
    } catch {
      setThumbnail(null);
    }
  };

  return thumbnail;
}
