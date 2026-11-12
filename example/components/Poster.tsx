import { Image, type ImageProps } from "react-native";

import { Skeleton } from "./Skeleton";
import { type PosterComponent, type PosterLoadingProps } from "./types";

const Loading = ({ width, height, borderRadius }: PosterLoadingProps) => (
  <Skeleton style={{ width, height, borderRadius }} />
);

export const Poster: PosterComponent & { Loading: typeof Loading } = Object.assign(
  (props: ImageProps) => <Image {...props} />,
  { Loading }
);
