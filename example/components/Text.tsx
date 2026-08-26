import { Text as RNText, type TextProps } from "react-native";

import { LoadingText } from "./LoadingText";
import { type TextComponent } from "./types";

export const Text: TextComponent & { Loading: typeof LoadingText } = Object.assign(
  (props: TextProps) => <RNText {...props} />,
  {
    Loading: LoadingText,
  }
);
