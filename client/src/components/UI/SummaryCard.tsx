import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: [string, string];
  bgColor?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = "#8b5cf6",
  trend,
  gradient,
  bgColor = "bg-gray-800",
}) => {
  const content = (
    <View className={`rounded-xl p-4 h-32`}>
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-gray-400 text-xs font-medium mb-1">{title}</Text>
          <View className="flex-row items-baseline gap-2">
            <Text className="text-white font-bold text-3xl">{value}</Text>
            {trend && (
              <View className={`px-2 py-1 rounded-md ${trend.isPositive ? "bg-green-500/15" : "bg-red-500/15"}`}>
                <Text
                  className={`text-xs font-semibold ${trend.isPositive ? "text-green-400" : "text-red-400"}`}
                >
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </Text>
              </View>
            )}
          </View>
        </View>
        {icon && (
          <View className="w-10 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: `${iconColor}15` }}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
        )}
      </View>
      {subtitle && (
        <Text className="text-gray-500 text-xs mt-auto">{subtitle}</Text>
      )}
    </View>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-xl border border-gray-700/50 overflow-hidden"
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View className={`${bgColor} rounded-xl border border-gray-700`}>
      {content}
    </View>
  );
};
