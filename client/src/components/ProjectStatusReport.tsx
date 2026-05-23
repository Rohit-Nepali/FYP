import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getProjectStatistics, ProjectStatistics } from "../services/projectService";
import StatCard from "./UI/StatCard";
import TaskStatusBreakdown from "./UI/TaskStatusBreakdown";
import PriorityDistribution from "./UI/PriorityDistribution";
import TeamWorkloadSection from "./UI/TeamWorkloadSection";

interface ProjectStatusReportProps {
  projectId: string;
}

export default function ProjectStatusReport({ projectId }: ProjectStatusReportProps) {
  const router = useRouter();
  const [statistics, setStatistics] = useState<ProjectStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await getProjectStatistics(projectId);
      setStatistics(data);
    } catch (err) {
      console.error("Failed to load statistics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [projectId]);

  if (loading && !statistics) {
    return (
      <View className="items-center justify-center py-10">
        <ActivityIndicator size="large" color="#60A5FA" />
      </View>
    );
  }

  if (!statistics) {
    return (
      <View className="items-center justify-center py-10">
        <Text className="text-gray-400 text-sm">Failed to load statistics</Text>
      </View>
    );
  }

  const { overview, statusBreakdown, priorityBreakdown, assigneeBreakdown } = statistics;

  const handleOpenTasks = (quickFilter: string) => {
    router.push(`/projects/${projectId}/tasks?quickFilter=${encodeURIComponent(quickFilter)}`);
  };

  const statCards = [
    { title: "Total Tasks", value: overview.totalTasks, icon: "list-outline", color: "#60A5FA", quickFilter: "all" },
    { title: "Completed", value: overview.completedTasks, icon: "checkmark-circle-outline", color: "#10B981", quickFilter: "completed" },
    { title: "In Progress", value: overview.inProgressTasks, icon: "hourglass-outline", color: "#3B82F6", quickFilter: "in-progress" },
    { title: "Overdue", value: overview.overdueTasks, icon: "alert-circle-outline", color: "#EF4444", quickFilter: "overdue" },
    { title: "Unassigned", value: overview.unassignedTasks, icon: "person-outline", color: "#F59E0B", quickFilter: "unassigned" },
    { title: "Due This Week", value: overview.tasksDueThisWeek, icon: "calendar-outline", color: "#8B5CF6", quickFilter: "due-this-week" },
  ] as const;


  return (
    <View className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/40">
      {/* Statistics Cards Grid */}
      <View className="mb-6">
        <Text className="text-white font-semibold text-lg px-1">Overview</Text>
        
        <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
          {statCards.map((card, i) => (
            <View key={i} style={{ width: "31%" }}>
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                iconColor={card.color}
                onPress={() => handleOpenTasks(card.quickFilter)}
              />
            </View>
          ))}
        </View>

        {/* Completion Percentage Card */}
        <LinearGradient
          colors={["#2563EB", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="mt-1 rounded-xl border border-gray-700 p-4 overflow-hidden"
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
      <View className="mb-6">
        <TaskStatusBreakdown
          statusBreakdown={statusBreakdown}
          totalTasks={overview.totalTasks}
        />
      </View>

      {/* Priority Distribution */}
      <View className="mb-6">
        <PriorityDistribution
          priorityBreakdown={priorityBreakdown}
          totalTasks={overview.totalTasks}
        />
      </View>

      {/* Team Workload */}
      <View className="mt-4">
        <TeamWorkloadSection assigneeBreakdown={assigneeBreakdown} />
      </View>
    </View>
  );
}
