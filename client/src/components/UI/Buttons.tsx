import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  icon,
}) => {
  const getButtonStyle = () => {
    const baseStyle = "rounded-xl h-14 justify-center items-center";

    if (variant === "primary") {
      return `${baseStyle} ${disabled ? "bg-blue-600 opacity-70" : "bg-blue-600"}`;
    }

    return `${baseStyle} bg-gray-900 border border-gray-700`;
  };

  return (
    <TouchableOpacity
      className={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <View className="flex-row items-center">
          {icon && <View className="mr-3">{icon}</View>}
          <Text
            className={`text-base font-medium ${
              variant === "primary" ? "text-white" : "text-gray-200"
            }`}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
