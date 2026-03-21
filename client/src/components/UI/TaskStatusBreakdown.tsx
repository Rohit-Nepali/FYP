import React from "react";
import { View, Text, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface StatusItem {
  name: string;
  color: string;
  count: number;
}

interface TaskStatusBreakdownProps {
  statusBreakdown: StatusItem[];
  totalTasks: number;
}

export default function TaskStatusBreakdown({
  statusBreakdown,
  totalTasks,
}: TaskStatusBreakdownProps) {
  // Convert hex color to rgb for opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, 0.1)`
      : "rgba(0, 0, 0, 0.1)";
  };

  if (totalTasks === 0) {
    return (
      <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50">
        <Text className="text-white font-bold text-base mb-4">
          Task Status Breakdown
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
        Task Status Breakdown
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {statusBreakdown.map((status, index) => {
            const percentage = totalTasks > 0 ? (status.count / totalTasks) * 100 : 0;
            return (
              <View
                key={index}
                className="rounded-xl p-3 min-w-[140] border"
                style={{
                  backgroundColor: hexToRgb(status.color),
                  borderColor: status.color + "40",
                }}
              >
                <View className="flex-row items-center mb-2">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: status.color }}
                  />
                  <Text className="text-gray-200 font-semibold text-sm flex-1" numberOfLines={1}>
                    {status.name}
                  </Text>
                </View>
                <Text className="text-white font-bold text-2xl mb-2">
                  {status.count}
                </Text>
                <View className="h-2.5 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: status.color,
                    }}
                  />
                </View>
                <Text className="text-gray-400 text-xs mt-2 font-medium">
                  {percentage.toFixed(0)}% of total
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
