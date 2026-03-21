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
          <View className="items-center py-12">
            <View className="w-16 h-16 rounded-full bg-gray-800/50 items-center justify-center mb-3">
              <Ionicons name="time-outline" size={32} color="#8B5CF6" />
            </View>
            <Text className="text-gray-300 text-base font-semibold mt-2">No activity yet</Text>
            <Text className="text-gray-500 text-xs mt-2 text-center px-4">
              Create tasks or add comments to see activity here
            </Text>
          </View>
        ) : (
          groupedActivities.map((group, groupIndex) => (
            <View key={groupIndex} className="mb-6">
              {/* Day Header */}
              <View className="flex-row items-center mb-4 px-1">
                <View className="flex-1 h-px bg-gradient-to-r from-gray-700 via-gray-700 to-transparent" />
                <View className="bg-purple-500/10 rounded-full px-3 py-1.5 mx-3 border border-purple-500/20">
                  <Text className="text-purple-300 text-xs font-bold">
                    {group.date}
                  </Text>
                </View>
                <View className="flex-1 h-px bg-gradient-to-l from-gray-700 via-gray-700 to-transparent" />
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
            className="items-center py-6"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#A78BFA" />
            ) : (
              <View className="bg-purple-500/10 border border-purple-500/30 rounded-lg flex-row items-center gap-2 px-4 py-2">
                <Text className="text-purple-400 text-sm font-semibold">Load More</Text>
                <Ionicons name="chevron-down" size={16} color="#A78BFA" />
              </View>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
