import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function BoardColumn({
  title,
  count,
  color,
  children,
}: {
  title: string;
  count: number;
  color: string; // e.g. "bg-blue-600"
  children: React.ReactNode;
}) {
  // Extract the color value more intelligently
  const colorMap: { [key: string]: { bg: string; border: string; badge: [string, string] } } = {
    "bg-blue-600": { bg: "#2563EB", border: "#2563EB40", badge: ["#3B82F6", "#1D4ED8"] },
    "bg-green-600": { bg: "#16A34A", border: "#16A34A40", badge: ["#22C55E", "#15803D"] },
    "bg-purple-600": { bg: "#9333EA", border: "#9333EA40", badge: ["#A855F7", "#7E22CE"] },
    "bg-amber-600": { bg: "#D97706", border: "#D9770640", badge: ["#F59E0B", "#B45309"] },
  };

  // Find matching color or use default
  const colorConfig = Object.values(colorMap)[Object.keys(colorMap).indexOf(color)] || 
                     { bg: "#8B5CF6", border: "#8B5CF640", badge: ["#A855F7", "#7E22CE"] };

  return (
    <LinearGradient
      colors={["#1F2937", "#111827"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="w-72 mr-4 rounded-xl border overflow-hidden"
      style={{ borderColor: colorConfig.border }}
    >
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white font-bold text-base">{title}</Text>
          <LinearGradient
            colors={colorConfig.badge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="px-3 py-1.5 rounded-full"
          >
            <Text className="text-white text-xs font-bold">{count}</Text>
          </LinearGradient>
        </View>

        <View className="gap-3">{children}</View>
      </View>
    </LinearGradient>
  );
}