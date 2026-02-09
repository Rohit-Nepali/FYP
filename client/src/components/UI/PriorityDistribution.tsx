import React from "react";
import { View, Text } from "react-native";

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
  if (totalTasks === 0) {
    return (
      <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
        <Text className="text-white font-semibold text-base mb-3">
          Priority Distribution
        </Text>
        <View className="items-center py-4">
          <Text className="text-gray-400 text-sm">No tasks to display</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
      <Text className="text-white font-semibold text-base mb-3">
        Priority Distribution
      </Text>
      <View className="space-y-3">
        {priorityBreakdown.map((priority, index) => {
          const percentage = totalTasks > 0 ? (priority.count / totalTasks) * 100 : 0;
          return (
            <View key={index} className="space-y-1">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: priority.color }}
                  />
                  <Text className="text-white font-medium text-sm">
                    {priority.name}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-white font-semibold text-sm mr-2">
                    {priority.count}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
              <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
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
