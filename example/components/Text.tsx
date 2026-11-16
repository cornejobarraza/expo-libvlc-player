import { Text as RNText, StyleSheet, type TextProps } from "react-native";

import { Skeleton } from "./Skeleton";
import { type LoadingProps, type TextComponent } from "./types";

const Loading = ({ style }: LoadingProps) => {
  const { height } = StyleSheet.flatten(style) ?? {};

  return (
    <Skeleton style={[{ borderRadius: typeof height === "number" ? height / 4 : 0 }, style]} />
  );
};

export const Text: TextComponent & { Loading: typeof Loading } = Object.assign(
  (props: TextProps) => <RNText {...props} />,
  { Loading }
);
