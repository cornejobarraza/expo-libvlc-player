import { Image, type ImageProps } from "react-native";

import { Skeleton } from "./Skeleton";
import { type LoadingProps, type PosterComponent } from "./types";

const Loading = ({ style }: LoadingProps) => <Skeleton style={style} />;

export const Poster: PosterComponent & { Loading: typeof Loading } = Object.assign(
  (props: ImageProps) => <Image {...props} />,
  { Loading }
);
