import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PriorityItem {
  name: string;
  color: string;
  count: number;
}

interface PriorityDistributionProps {
  priorityBreakdown: PriorityItem[];
  totalTasks: number;
}

export default function PriorityDistribution({
  priorityBreakdown,
  totalTasks,
}: PriorityDistributionProps) {
  // Convert hex to rgb for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, 0.1)` : "rgba(0, 0, 0, 0.1)";
  };

  const getPriorityIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const lower = name.toLowerCase();
    if (lower.includes("high")) return "alert-circle-outline";
    if (lower.includes("medium")) return "remove-circle-outline";
    if (lower.includes("low")) return "checkmark-circle-outline";
    return "help-circle-outline";
  };

  if (totalTasks === 0) {
    return (
      <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50">
        <Text className="text-white font-bold text-base mb-4">
          Priority Distribution
        </Text>
        <View className="items-center py-6">
          <Text className="text-gray-400 text-sm">No tasks to display</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50 overflow-hidden">
      <Text className="text-white font-bold text-base mb-4">
        Priority Distribution
      </Text>
      <View className="gap-4">
        {priorityBreakdown.map((priority, index) => {
          const percentage = totalTasks > 0 ? (priority.count / totalTasks) * 100 : 0;
          return (
            <View key={index} className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2 flex-1">
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: priority.color }}
                  />
                  <Text className="text-gray-200 font-semibold text-sm flex-1">
                    {priority.name}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2 bg-gray-800/50 rounded-lg px-2.5 py-1">
                  <Text className="text-white font-bold text-sm">
                    {priority.count}
                  </Text>
                  <Text className="text-gray-400 text-xs font-medium">
                    {percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
              <View
                className="h-2.5 rounded-full overflow-hidden border"
                style={{
                  backgroundColor: hexToRgb(priority.color),
                  borderColor: priority.color + "40",
                }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: priority.color,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
