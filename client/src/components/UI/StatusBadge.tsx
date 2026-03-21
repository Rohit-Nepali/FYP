import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatusBadgeProps {
  label: string;
  color: string;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: "small" | "medium" | "large";
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  color,
  icon,
  size = "medium",
  showDot = true,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { container: "px-2 py-1 rounded-md", text: "text-xs", iconSize: 12 };
      case "large":
        return { container: "px-4 py-2.5 rounded-xl", text: "text-sm", iconSize: 16 };
      case "medium":
      default:
        return { container: "px-3 py-1.5 rounded-lg", text: "text-xs", iconSize: 14 };
    }
  };

  const styles = getSizeStyles();
  // Convert hex color to RGB for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 0, 0";
  };

  const rgb = hexToRgb(color);

  return (
    <View
      className={`flex-row items-center gap-1.5 ${styles.container}`}
      style={{
        backgroundColor: `rgba(${rgb}, 0.15)`,
        borderWidth: 1,
        borderColor: `rgba(${rgb}, 0.4)`,
      }}
    >
      {showDot && (
        <View
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {icon && (
        <Ionicons name={icon} size={styles.iconSize} color={color} />
      )}
      <Text className={`font-semibold ${styles.text}`} style={{ color }}>
        {label}
      </Text>
    </View>
  );
};
