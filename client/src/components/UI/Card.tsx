import React from "react";
import { View, ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface EnhancedCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: "default" | "gradient" | "subtle";
  padding?: "small" | "medium" | "large";
  borderColor?: string;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  variant = "default",
  padding = "medium",
  borderColor = "#374151",
  ...props
}) => {
  const getPaddingStyles = () => {
    switch (padding) {
      case "small":
        return "p-2";
      case "large":
        return "p-5";
      case "medium":
      default:
        return "p-4";
    }
  };

  const baseStyles = `rounded-xl border ${getPaddingStyles()}`;

  if (variant === "gradient") {
    return (
      <LinearGradient
        colors={["#1F2937", "#111827"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={`${baseStyles} border-gray-700/50`}
        {...props}
      >
        {children}
      </LinearGradient>
    );
  }

  if (variant === "subtle") {
    return (
      <View
        className={`${baseStyles} bg-gray-800/40 border-gray-700/30`}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      className={`${baseStyles} bg-gray-800 border-gray-700`}
      {...props}
    >
      {children}
    </View>
  );
};
