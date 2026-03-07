import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "danger-ghost";
  size?: "small" | "medium" | "large";
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "medium",
  icon,
  iconPosition = "left",
  className = "",
}) => {
  const getSizeStyles = (): { container: string; text: string; iconSize: number } => {
    switch (size) {
      case "small":
        return {
          container: "h-9 px-3 rounded-lg",
          text: "text-sm",
          iconSize: 14,
        };
      case "large":
        return {
          container: "h-14 px-6 rounded-xl",
          text: "text-base",
          iconSize: 20,
        };
      case "medium":
      default:
        return {
          container: "h-12 px-4 rounded-xl",
          text: "text-base",
          iconSize: 18,
        };
    }
  };

  const getVariantStyles = (): { container: string; text: string; border?: string } => {
    const isDisabled = disabled || loading;

    switch (variant) {
      case "secondary":
        return {
          container: isDisabled ? "bg-gray-700" : "bg-gray-800 border border-gray-600",
          text: isDisabled ? "text-gray-500" : "text-gray-200",
        };
      case "danger":
        return {
          container: isDisabled ? "bg-red-600/50" : "bg-red-600",
          text: "text-white",
        };
      case "danger-ghost":
        return {
          container: "border border-red-500 bg-transparent",
          text: isDisabled ? "text-red-400/50" : "text-red-500",
        };
      case "primary":
      default:
        return {
          container: isDisabled ? "bg-blue-600/50" : "bg-blue-600",
          text: "text-white",
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={variantStyles.text.includes("white") ? "#FFFFFF" : "#9CA3AF"} />;
    }

    const iconColor = variantStyles.text.includes("white") 
      ? "#FFFFFF" 
      : variantStyles.text.includes("500") 
        ? "#EF4444" 
        : "#9CA3AF";

    const renderIcon = () => {
      if (!icon) return null;
      return <Ionicons name={icon} size={sizeStyles.iconSize} color={iconColor} />;
    };

    return (
      <View className="flex-row items-center justify-center">
        {icon && iconPosition === "left" && (
          <View className="mr-2">{renderIcon()}</View>
        )}
        <Text className={`font-medium ${sizeStyles.text} ${variantStyles.text}`}>
          {title}
        </Text>
        {icon && iconPosition === "right" && (
          <View className="ml-2">{renderIcon()}</View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      className={`${sizeStyles.container} ${variantStyles.container} justify-center items-center flex-row ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// Keep PrimaryButton as an alias for backward compatibility
export const PrimaryButton: React.FC<Omit<ButtonProps, "variant"> & { variant?: "primary" | "secondary" }> = (props) => {
  return <Button {...props} variant={props.variant === "secondary" ? "secondary" : "primary"} />;
};

export default Button;
