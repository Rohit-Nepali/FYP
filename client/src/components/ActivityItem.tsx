import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Activity } from "@/src/types/activity";
import { useRouter } from "expo-router";

interface ActivityItemProps {
  activity: Activity;
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const router = useRouter();

  const getActivityIcon = () => {
    switch (activity.type) {
      case "TASK_CREATED":
        return { name: "add-circle-outline" as const, color: "#3B82F6" };
      case "TASK_UPDATED":
        return { name: "create-outline" as const, color: "#F97316" };
      case "COMMENT_ADDED":
        return { name: "chatbubble-outline" as const, color: "#10B981" };
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
      case "TASK_UPDATED":
        return `${userName} updated task "${taskTitle}"`;
      case "COMMENT_ADDED":
        return `${userName} commented on "${taskTitle}"`;
      default:
        return `${userName} performed an action`;
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

  return (
    <TouchableOpacity
      onPress={() => {
        if (activity.task?.id) {
          router.push(`/tasks/${activity.task.id}`);
        }
      }}
      className="flex-row items-start bg-gray-800/50 rounded-xl p-3 mb-2 border border-gray-700"
      activeOpacity={0.7}
    >
      {/* User Avatar */}
      <View className="mr-3">
        {activity.user.profileImage ? (
          <Image
            source={{ uri: activity.user.profileImage }}
            className="w-10 h-10 rounded-full border-2 border-gray-700"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center border-2 border-gray-700">
            <Text className="text-white text-sm font-semibold">
              {activity.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Activity Content */}
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          {/* Activity Icon */}
          <View
            className="w-6 h-6 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: icon.color }}
          >
            <Ionicons name={icon.name} size={12} color="#fff" />
          </View>

          {/* Activity Text */}
          <Text className="text-gray-200 text-sm flex-1">
            {getActivityText()}
          </Text>
        </View>

        {/* Timestamp */}
        <Text className="text-gray-500 text-xs mt-1">
          {formatRelativeTime(activity.createdAt)}
        </Text>

        {/* Comment Preview (if applicable) */}
        {activity.type === "COMMENT_ADDED" && activity.metadata?.commentPreview && (
          <View className="mt-2 bg-gray-700/50 rounded-lg px-3 py-2">
            <Text className="text-gray-400 text-xs italic">
              "{activity.metadata.commentPreview}..."
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
