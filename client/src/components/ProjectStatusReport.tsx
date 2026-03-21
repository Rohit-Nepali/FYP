import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getProjectStatistics, ProjectStatistics } from "../services/projectService";
import StatCard from "./UI/StatCard";
import TaskStatusBreakdown from "./UI/TaskStatusBreakdown";
import PriorityDistribution from "./UI/PriorityDistribution";
import TeamWorkloadSection from "./UI/TeamWorkloadSection";

interface ProjectStatusReportProps {
  projectId: string;
}

export default function ProjectStatusReport({ projectId }: ProjectStatusReportProps) {
  const [statistics, setStatistics] = useState<ProjectStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatistics = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await getProjectStatistics(projectId);
      setStatistics(data);
    } catch (err) {
      console.error("Failed to load statistics", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [projectId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStatistics(true);
  };

  if (loading && !statistics) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator size="large" color="#60A5FA" />
      </View>
    );
  }

  if (!statistics) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <Text className="text-gray-400 text-sm">Failed to load statistics</Text>
      </View>
    );
  }

  const { overview, statusBreakdown, priorityBreakdown, assigneeBreakdown } = statistics;

  const statCards = [
    { title: "Total Tasks", value: overview.totalTasks, icon: "list-outline", color: "#60A5FA" },
    { title: "Completed", value: overview.completedTasks, icon: "checkmark-circle-outline", color: "#10B981" },
    { title: "In Progress", value: overview.inProgressTasks, icon: "hourglass-outline", color: "#3B82F6" },
    { title: "Overdue", value: overview.overdueTasks, icon: "alert-circle-outline", color: "#EF4444" },
    { title: "Unassigned", value: overview.unassignedTasks, icon: "person-outline", color: "#F59E0B" },
    { title: "Due This Week", value: overview.tasksDueThisWeek, icon: "calendar-outline", color: "#8B5CF6" },
  ] as const;


  return (
    <ScrollView
      className="flex-1"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" />
      }
    >
      <View className="space-y-4 pb-4">
        {/* Statistics Cards Grid */}
        <View className="space-y-3 mb-2">
          <Text className="text-white font-semibold text-lg px-1">Overview</Text>
          <View className="flex-row flex-wrap justify-between">
            {statCards.map((card, i) => (
              <View key={i} className="w-[31%] mb-3">
                <StatCard
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  iconColor={card.color}
                />
              </View>
            ))}
          </View>

          {/* Completion Percentage Card */}
          <LinearGradient
            colors={["#2563EB", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-xl p-4 border border-gray-700 overflow-hidden"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-200 text-xs mb-1">Project Completion</Text>
                <Text className="text-white font-bold text-3xl">
                  {overview.completionPercentage}%
                </Text>
              </View>
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
                <Text className="text-white font-bold text-xl">
                  {overview.completedTasks}/{overview.totalTasks}
                </Text>
              </View>
            </View>
            <View className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-white rounded-full"
                style={{ width: `${overview.completionPercentage}%` }}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Task Status Breakdown */}
        <TaskStatusBreakdown
          statusBreakdown={statusBreakdown}
          totalTasks={overview.totalTasks}
        />

        {/* Priority Distribution */}
        <PriorityDistribution
          priorityBreakdown={priorityBreakdown}
          totalTasks={overview.totalTasks}
        />

        {/* Team Workload */}
        <TeamWorkloadSection assigneeBreakdown={assigneeBreakdown} />
      </View>
    </ScrollView>
  );
}
