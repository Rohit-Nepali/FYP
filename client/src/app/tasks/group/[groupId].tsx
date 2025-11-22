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
import { theme } from "../../../config/theme";
import { SafeAreaView } from "react-native-safe-area-context";

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export default function GroupTasksScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadTasks();
  }, [filterStatus]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      // TODO: Implement getGroupTasks in taskService
      const result = await getGroupTasks(groupId as string);
      setTasks(result);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load group tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "CANCELLED":
        return "bg-gray-500";
      default:
        return "bg-yellow-500";
    }
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
            <View className="flex-row gap-2">
              {["all", "TODO", "IN_PROGRESS", "COMPLETED"].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setFilterStatus(filter)}
                  className={`px-4 py-2 rounded-lg ${
                    filterStatus === filter ? "bg-blue-600" : "bg-gray-800"
                  }`}
                >
                  <Text className="text-white text-sm font-medium capitalize">
                    {filter === "all" ? "All" : filter.replace("_", " ")}
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
                              task.status === "COMPLETED"
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
                            {task.userId}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`px-2 py-1 rounded ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            <Text className="text-white text-xs font-medium">
                              {task.priority}
                            </Text>
                          </View>
                          <View
                            className={`px-2 py-1 rounded ${getStatusColor(
                              task.status
                            )}`}
                          >
                            <Text className="text-white text-xs font-medium">
                              {task.status.replace("_", " ")}
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
