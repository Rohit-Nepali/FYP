import React from "react";
import { View, Text } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "primary" | "success" | "warning" | "danger" | "secondary";
  size?: "small" | "medium" | "large";
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "primary",
  size = "medium",
  icon,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-green-500/20 border border-green-500/40";
      case "warning":
        return "bg-amber-500/20 border border-amber-500/40";
      case "danger":
        return "bg-red-500/20 border border-red-500/40";
      case "secondary":
        return "bg-gray-700/60 border border-gray-600/50";
      case "primary":
      default:
        return "bg-blue-500/20 border border-blue-500/40";
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "success":
        return "text-green-300";
      case "warning":
        return "text-amber-300";
      case "danger":
        return "text-red-300";
      case "secondary":
        return "text-gray-200";
      case "primary":
      default:
        return "text-blue-300";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return "px-2 py-1 rounded-md";
      case "large":
        return "px-4 py-2 rounded-xl";
      case "medium":
      default:
        return "px-3 py-1.5 rounded-lg";
    }
  };

  return (
    <View className={`flex-row items-center gap-1.5 ${getVariantStyles()} ${getSizeStyles()}`}>
      {icon && icon}
      <Text className={`text-xs font-semibold ${getTextColor()}`}>{label}</Text>
    </View>
  );
};
