import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { TouchableOpacity } from "react-native";

interface PlayerControlProps {
  icon: string;
  size?: number;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export const PlayerControl = ({
  icon,
  size = 16,
  selected,
  disabled,
  onPress,
}: PlayerControlProps) => {
  return (
    <TouchableOpacity
      style={{
        backgroundColor: !disabled ? (!selected ? "black" : "darkred") : "gray",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
      }}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled}
    >
      <FontAwesome5 name={icon} color="white" size={size} />
    </TouchableOpacity>
  );
};
