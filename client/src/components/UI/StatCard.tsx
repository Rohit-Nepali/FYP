import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor?: string;
  gradient?: [string, string];
}

export default function StatCard({
  title,
  value,
  icon,
  iconColor,
  bgColor = "bg-gray-800",
  gradient,
}: StatCardProps) {
  // Convert hex color to rgb for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, 0.1)`
      : "rgba(0, 0, 0, 0.1)";
  };

  const content = (
    <View className="rounded-xl p-4 border border-gray-700/50 overflow-hidden">
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="w-10 h-10 rounded-lg items-center justify-center border"
          style={{
            backgroundColor: hexToRgb(iconColor),
            borderColor: iconColor + "40",
          }}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text className="text-gray-400 text-xs font-semibold">{title}</Text>
      </View>
      <Text className="text-white font-bold text-3xl">{value}</Text>
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View className="flex-1">
      {content}
    </View>
  );
}
