import MaterialIcons from "@react-native-vector-icons/material-icons";

import { type IconProps } from "./types";
import { ICON_SYMBOLS } from "../constants";

export const Icon = ({ style, name, size = 24, color }: IconProps) => {
  return <MaterialIcons style={style} name={ICON_SYMBOLS[name]} size={size} color={color} />;
};
