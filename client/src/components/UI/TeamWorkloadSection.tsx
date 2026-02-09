import React from "react";
import { View, Text, Image, ScrollView } from "react-native";

interface Assignee {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface AssigneeWorkload {
  assignee: Assignee;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

interface TeamWorkloadSectionProps {
  assigneeBreakdown: AssigneeWorkload[];
}

export default function TeamWorkloadSection({
  assigneeBreakdown,
}: TeamWorkloadSectionProps) {
  if (assigneeBreakdown.length === 0) {
    return (
      <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
        <Text className="text-white font-semibold text-base mb-3">
          Team Workload
        </Text>
        <View className="items-center py-4">
          <Text className="text-gray-400 text-sm">No assigned tasks</Text>
        </View>
      </View>
    );
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  return (
    <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
      <Text className="text-white font-semibold text-base mb-3">
        Team Workload
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-3">
          {assigneeBreakdown.map((workload, index) => {
            const completionRate =
              workload.total > 0
                ? Math.round((workload.completed / workload.total) * 100)
                : 0;

            return (
              <View
                key={workload.assignee.id || index}
                className="bg-gray-900/60 rounded-xl p-3 min-w-[160px]"
              >
                {/* Assignee Info */}
                <View className="flex-row items-center mb-3">
                  {workload.assignee.profileImage ? (
                    <Image
                      source={{ uri: workload.assignee.profileImage }}
                      className="w-10 h-10 rounded-full mr-2"
                    />
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center mr-2">
                      <Text className="text-white text-sm font-semibold">
                        {getInitials(workload.assignee.name)}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text
                      className="text-white font-medium text-sm"
                      numberOfLines={1}
                    >
                      {workload.assignee.name}
                    </Text>
                    <Text className="text-gray-400 text-xs" numberOfLines={1}>
                      {workload.total} task{workload.total !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                {/* Stats */}
                <View className="space-y-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-400 text-xs">Completed</Text>
                    <Text className="text-green-400 font-semibold text-sm">
                      {workload.completed}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-400 text-xs">In Progress</Text>
                    <Text className="text-blue-400 font-semibold text-sm">
                      {workload.inProgress}
                    </Text>
                  </View>
                  {workload.overdue > 0 && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-400 text-xs">Overdue</Text>
                      <Text className="text-red-400 font-semibold text-sm">
                        {workload.overdue}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Completion Rate Bar */}
                <View className="mt-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-400 text-xs">Completion</Text>
                    <Text className="text-white font-semibold text-xs">
                      {completionRate}%
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
