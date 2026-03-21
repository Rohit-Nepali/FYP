import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getProjectActivities } from "@/src/services/activityService";
import { Activity } from "@/src/types/activity";
import ActivityItem from "./ActivityItem";

interface ActivitySectionProps {
  projectId: string;
}

interface ActivityGroup {
  date: string;
  activities: Activity[];
}

export default function ActivitySection({ projectId }: ActivitySectionProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadActivities = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      const response = await getProjectActivities(projectId, pageNum, 10);
      const nextActivities = Array.isArray(response?.data) ? response.data : [];

      if (append) {
        setActivities((prev) => [...prev, ...nextActivities]);
      } else {
        setActivities(nextActivities);
      }
      setHasMore(Boolean(response?.pagination?.hasMore));
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [projectId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities(1, false);
  };

  const onLoadMore = () => {
    if (hasMore && !loading) {
      loadActivities(page + 1, true);
    }
  };

  const groupActivitiesByDay = (activities: Activity[] = []): ActivityGroup[] => {
    if (!Array.isArray(activities) || activities.length === 0) {
      return [];
    }

    const groups: Record<string, Activity[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    activities.forEach((activity) => {
      const activityDate = new Date(activity.createdAt);
      activityDate.setHours(0, 0, 0, 0);

      let key: string;
      if (activityDate.getTime() === today.getTime()) {
        key = "Today";
      } else if (activityDate.getTime() === yesterday.getTime()) {
        key = "Yesterday";
      } else {
        key = activityDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(activity);
    });

    return Object.entries(groups).map(([date, activities]) => ({ date, activities }));
  };

  const groupedActivities = groupActivitiesByDay(activities);

  if (loading && activities.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator size="large" color="#60A5FA" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" />
        }
      >
        {groupedActivities.length === 0 ? (
          <View className="items-center py-8">
            <Ionicons name="time-outline" size={40} color="#6B7280" />
            <Text className="text-gray-400 text-sm mt-2">No recent activity</Text>
            <Text className="text-gray-500 text-xs mt-1 text-center">
              Create tasks or add comments to see activity here
            </Text>
          </View>
        ) : (
          groupedActivities.map((group, groupIndex) => (
            <View key={groupIndex} className="mb-4">
              {/* Day Header */}
              <View className="flex-row items-center mb-2">
                <View className="flex-1 h-px bg-gray-700" />
                <Text className="text-gray-400 text-xs font-medium mx-3">
                  {group.date}
                </Text>
                <View className="flex-1 h-px bg-gray-700" />
              </View>

              {/* Activities for this day */}
              {group.activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </View>
          ))
        )}

        {/* Load More Button */}
        {hasMore && (
          <TouchableOpacity
            onPress={onLoadMore}
            disabled={loading}
            className="items-center py-4"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#60A5FA" />
            ) : (
              <View className="flex-row items-center">
                <Text className="text-blue-400 text-sm font-medium">Load More</Text>
                <Ionicons name="chevron-down" size={16} color="#60A5FA" />
              </View>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
