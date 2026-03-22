import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  getNotifications,
  InAppNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/userService";

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadNotifications = useCallback(async () => {
    const data = await getNotifications(false);
    setNotifications(data);
  }, []);

  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      await loadNotifications();
    } finally {
      setIsLoading(false);
    }
  }, [loadNotifications]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const onRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await loadNotifications();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      setIsUpdating(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        }))
      );
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const handleOpenNotification = useCallback(async (item: InAppNotification) => {
    if (item.isRead) return;

    try {
      await markNotificationAsRead(item.id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === item.id
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );
    } catch (error) {
      // keep UI stable if network fails
    }
  }, []);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="pt-6 pb-4 px-6 bg-gray-900/50 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-white">Notifications</Text>

        <TouchableOpacity
          disabled={unreadCount === 0 || isUpdating}
          onPress={handleMarkAllRead}
          className={`px-3 py-1.5 rounded-lg ${
            unreadCount === 0 || isUpdating ? "bg-gray-700/50" : "bg-purple-500/20"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              unreadCount === 0 || isUpdating ? "text-gray-500" : "text-purple-300"
            }`}
          >
            {isUpdating ? "Updating..." : "Mark all read"}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#a78bfa" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#a78bfa" />
          }
        >
          {notifications.length === 0 ? (
            <View className="mt-24 items-center px-8">
              <View className="w-14 h-14 rounded-2xl bg-gray-800 items-center justify-center mb-4">
                <Ionicons name="notifications-off-outline" size={24} color="#6B7280" />
              </View>
              <Text className="text-gray-300 font-semibold text-base">No notifications yet</Text>
              <Text className="text-gray-500 text-sm text-center mt-1">
                Updates like invites, assignments, and comments will appear here.
              </Text>
            </View>
          ) : (
            <View className="pt-2 gap-2">
              {notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleOpenNotification(item)}
                  className={`rounded-xl border p-4 ${
                    item.isRead
                      ? "bg-gray-800/60 border-gray-700/40"
                      : "bg-purple-500/10 border-purple-500/30"
                  }`}
                  activeOpacity={0.75}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-semibold text-sm">{item.title}</Text>
                      <Text className="text-gray-300 text-sm mt-1">{item.message}</Text>
                      <Text className="text-gray-500 text-xs mt-2">
                        {formatRelativeTime(item.createdAt)}
                      </Text>
                    </View>

                    {!item.isRead && <View className="w-2.5 h-2.5 rounded-full bg-purple-400 mt-1" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
