import React from "react";
import { View, Text, ScrollView } from "react-native";

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
  if (totalTasks === 0) {
    return (
      <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
        <Text className="text-white font-semibold text-base mb-3">
          Task Status Breakdown
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
        Task Status Breakdown
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-3">
          {statusBreakdown.map((status, index) => {
            const percentage = totalTasks > 0 ? (status.count / totalTasks) * 100 : 0;
            return (
              <View
                key={index}
                className="bg-gray-900/60 rounded-xl p-3 min-w-[120px]"
              >
                <View className="flex-row items-center mb-2">
                  <View
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: status.color }}
                  />
                  <Text className="text-white font-medium text-sm" numberOfLines={1}>
                    {status.name}
                  </Text>
                </View>
                <Text className="text-white font-bold text-xl mb-1">
                  {status.count}
                </Text>
                <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: status.color,
                    }}
                  />
                </View>
                <Text className="text-gray-400 text-xs mt-1">
                  {percentage.toFixed(0)}%
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
