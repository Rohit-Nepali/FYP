import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../../../components/ProtectedRoute";
import { useAuth } from "../../../contexts/AuthContext";
import { Task, getGroupTasks } from "../../../services/taskService";
import { getAllStatuses } from "../../../services/statusService";
import { theme } from "../../../config/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GroupTasksScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatusId, setFilterStatusId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filterStatusId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksResult, statusesData] = await Promise.all([
        getGroupTasks(groupId as string),
        getAllStatuses(),
      ]);
      setTasks(tasksResult);
      setStatuses(statusesData);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    if (priority.color) {
      return { backgroundColor: priority.color };
    }
    return { backgroundColor: "#6B7280" };
  };

  const getStatusColor = (status: Task["status"]) => {
    if (status.color) {
      return { backgroundColor: status.color };
    }
    return { backgroundColor: "#6B7280" };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <ProtectedRoute>
      <SafeAreaView className="flex-1 bg-gray-900">
        <LinearGradient colors={theme.background.gradient} className="flex-1">
          {/* Header */}
          <View className="pt-6 pb-4 px-6 bg-gray-900/50">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-white">Group Tasks</Text>
              <View className="w-6" />
            </View>

            {/* Filter Buttons */}
            <View className="flex-row gap-2 flex-wrap">
              <TouchableOpacity
                onPress={() => setFilterStatusId(null)}
                className={`px-4 py-2 rounded-lg ${
                  filterStatusId === null ? "bg-blue-600" : "bg-gray-800"
                }`}
              >
                <Text className="text-white text-sm font-medium">All</Text>
              </TouchableOpacity>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status.id}
                  onPress={() => setFilterStatusId(status.id)}
                  className={`px-4 py-2 rounded-lg ${
                    filterStatusId === status.id ? "bg-blue-600" : "bg-gray-800"
                  }`}
                >
                  <Text className="text-white text-sm font-medium">
                    {status.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tasks List */}
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#60A5FA" />
            </View>
          ) : (
            <ScrollView
              className="flex-1 px-4 py-4"
              contentContainerStyle={{ paddingBottom: 80 }}
            >
              {tasks.length === 0 ? (
                <View className="flex-1 justify-center items-center py-20">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={64}
                    color="#6B7280"
                  />
                  <Text className="text-gray-400 text-lg mt-4">
                    No tasks found
                  </Text>
                  <Text className="text-gray-500 text-sm mt-2">
                    Group members haven't created any tasks yet
                  </Text>
                </View>
              ) : (
                tasks.map((task) => (
                  <View
                    key={task.id}
                    className="bg-gray-800 rounded-xl p-4 mb-3 border border-gray-700"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text
                            className={`text-lg font-semibold text-gray-200 flex-1 ${
                              task.status.name
                                .toLowerCase()
                                .includes("complete") ||
                              task.status.name.toLowerCase().includes("done")
                                ? "line-through opacity-60"
                                : ""
                            }`}
                          >
                            {task.title}
                          </Text>
                        </View>
                        {task.description && (
                          <Text className="text-gray-400 text-sm mb-2">
                            {task.description}
                          </Text>
                        )}
                        <View className="flex-row items-center gap-2 mb-2">
                          <Ionicons
                            name="person-outline"
                            size={14}
                            color="#9CA3AF"
                          />
                          <Text className="text-gray-400 text-sm">
                            {task.creatorId}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <View
                            className="px-2 py-1 rounded"
                            style={getPriorityColor(task.priority)}
                          >
                            <Text className="text-white text-xs font-medium">
                              {task.priority.name}
                            </Text>
                          </View>
                          <View
                            className="px-2 py-1 rounded"
                            style={getStatusColor(task.status)}
                          >
                            <Text className="text-white text-xs font-medium">
                              {task.status.name}
                            </Text>
                          </View>
                          {task.dueDate && (
                            <View className="flex-row items-center">
                              <Ionicons
                                name="calendar-outline"
                                size={14}
                                color="#9CA3AF"
                              />
                              <Text className="text-gray-400 text-xs ml-1">
                                {formatDate(task.dueDate)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </LinearGradient>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
