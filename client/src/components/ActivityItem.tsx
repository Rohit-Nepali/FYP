import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Activity, CORE_ACTIVITY_TYPES } from "@/src/types/activity";
import { useRouter } from "expo-router";
import { resolveFileUrl } from "@/src/utils/url";

interface ActivityItemProps {
  activity: Activity;
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const router = useRouter();

  const getActivityIcon = () => {
    switch (activity.type) {
      case "TASK_CREATED":
        return { name: "add-circle-outline" as const, color: "#3B82F6" };
      case "ATTACHMENT_ADDED":
        return { name: "attach-outline" as const, color: "#F59E0B" };
      default:
        return { name: "ellipse-outline" as const, color: "#6B7280" };
    }
  };

  const getActivityText = () => {
    const userName = activity.user.name;
    const taskTitle = activity.metadata?.taskTitle || activity.task?.title || "a task";

    switch (activity.type) {
      case "TASK_CREATED":
        return `${userName} created task "${taskTitle}"`;
      case "ATTACHMENT_ADDED":
        return `${userName} uploaded file to "${taskTitle}"`;
      default:
        return null; // Should not display non-core activities
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const icon = getActivityIcon();

  const getActivityAccentColor = () => {
    switch (activity.type) {
      case "TASK_CREATED":
        return { bg: "#3B82F615", border: "#3B82F640" };
      case "ATTACHMENT_ADDED":
        return { bg: "#F59E0B15", border: "#F59E0B40" };
      default:
        return { bg: "#6B728015", border: "#6B728040" };
    }
  };

  const accentColor = getActivityAccentColor();

  return (
    <TouchableOpacity
      onPress={() => {
        if (activity.task?.id) {
          router.push(`/tasks?taskId=${activity.task.id}`);
        }
      }}
      className="flex-row items-start rounded-xl p-4 mb-3 border"
      style={{
        backgroundColor: accentColor.bg,
        borderColor: accentColor.border,
      }}
      activeOpacity={0.6}
    >
      {/* User Avatar */}
      <View className="mr-3">
        {activity.user.profileImage ? (
          <Image
            source={{ uri: resolveFileUrl(activity.user.profileImage) }}
            className="w-10 h-10 rounded-full border-2 border-gray-700"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 items-center justify-center border-2 border-gray-700/50">
            <Text className="text-white text-sm font-bold">
              {activity.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Activity Content */}
      <View className="flex-1">
        <View className="flex-row items-center mb-2">
          {/* Activity Icon */}
          <View
            className="w-6 h-6 rounded-full items-center justify-center mr-2"
            style={{
              backgroundColor: icon.color + "20",
              borderWidth: 1,
              borderColor: icon.color + "40",
            }}
          >
            <Ionicons name={icon.name} size={13} color={icon.color} />
          </View>

          {/* Activity Text */}
          <Text className="text-gray-100 text-sm flex-1 font-medium">
            {getActivityText()}
          </Text>
        </View>

        {/* Timestamp */}
        <Text className="text-gray-500 text-xs ml-8">
          {formatRelativeTime(activity.createdAt)}
        </Text>

        {/* File name (if applicable) */}
        {activity.type === "ATTACHMENT_ADDED" && activity.metadata?.fileName && (
          <View className="mt-2 ml-8 bg-gray-700/40 rounded-lg px-3 py-2 border border-gray-600/30">
            <Text className="text-gray-300 text-xs italic">
              📎 {activity.metadata.fileName}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
