import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  iconColor,
  bgColor = "bg-gray-800",
}: StatCardProps) {
  return (
    <View className={`${bgColor} rounded-xl p-4 border border-gray-700 flex-1`}>
      <View className="flex-row items-center justify-between mb-2">
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text className="text-gray-400 text-xs">{title}</Text>
      </View>
      <Text className="text-white font-bold text-2xl">{value}</Text>
    </View>
  );
}
