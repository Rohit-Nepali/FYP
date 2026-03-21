import React from "react";
import { View, Text, Image, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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
      <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50">
        <Text className="text-white font-bold text-base mb-4">
          Team Workload
        </Text>
        <View className="items-center py-6">
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
    <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50 overflow-hidden">
      <Text className="text-white font-bold text-base mb-4">
        Team Workload
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {assigneeBreakdown.map((workload, index) => {
            const completionRate =
              workload.total > 0
                ? Math.round((workload.completed / workload.total) * 100)
                : 0;

            return (
              <LinearGradient
                key={workload.assignee.id || index}
                colors={["#1F2937", "#111827"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-xl p-3 min-w-[165] border border-gray-700/50"
              >
                {/* Assignee Info */}
                <View className="flex-row items-center mb-3">
                  {workload.assignee.profileImage ? (
                    <Image
                      source={{ uri: workload.assignee.profileImage }}
                      className="w-10 h-10 rounded-full border border-gray-600/50 mr-2"
                    />
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 items-center justify-center mr-2 border border-purple-500/30">
                      <Text className="text-white text-xs font-bold">
                        {getInitials(workload.assignee.name)}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text
                      className="text-white font-semibold text-sm"
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
                <View className="space-y-2 mb-3 pb-3 border-b border-gray-700/30">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-400 text-xs font-medium">Completed</Text>
                    <View className="bg-green-500/15 rounded px-2 py-0.5">
                      <Text className="text-green-400 font-bold text-xs">
                        {workload.completed}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-400 text-xs font-medium">In Progress</Text>
                    <View className="bg-blue-500/15 rounded px-2 py-0.5">
                      <Text className="text-blue-400 font-bold text-xs">
                        {workload.inProgress}
                      </Text>
                    </View>
                  </View>
                  {workload.overdue > 0 && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-400 text-xs font-medium">Overdue</Text>
                      <View className="bg-red-500/15 rounded px-2 py-0.5">
                        <Text className="text-red-400 font-bold text-xs">
                          {workload.overdue}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Completion Rate Bar */}
                <View>
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-gray-400 text-xs font-medium">Completion</Text>
                    <Text className="text-green-400 font-bold text-xs">
                      {completionRate}%
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30">
                    <View
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </View>
                </View>
              </LinearGradient>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
