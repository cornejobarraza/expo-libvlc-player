import { Platform } from "react-native";

export function useFullScreen() {
  return Platform.isTV;
}
