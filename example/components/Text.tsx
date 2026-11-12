import { Text as RNText, type TextProps } from "react-native";

import { Skeleton } from "./Skeleton";
import { type LoadingProps, type TextComponent } from "./types";

const Loading = ({ width, height }: LoadingProps) => (
  <Skeleton style={{ width, height, borderRadius: height / 4 }} />
);

export const Text: TextComponent & { Loading: typeof Loading } = Object.assign(
  (props: TextProps) => <RNText {...props} />,
  { Loading }
);
