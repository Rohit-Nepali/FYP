// app/tasks/[id].tsx
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Task, getTaskById } from "../../services/taskService";

export default function TaskDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const loadTask = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await getTaskById(taskId);
        setTask(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load task details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!taskId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-300 text-center">
            No task id provided.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isDone =
    task &&
    task.status &&
    (task.status.name.toLowerCase().includes("complete") ||
      task.status.name.toLowerCase().includes("done"));

  const description = (task as any)?.description as string | undefined;
  const projectTitle =
    (task as any)?.project?.title ||
    (task as any)?.project?.name ||
    undefined;
  const projectId =
    (task as any)?.project?.id || (task as any)?.projectId || undefined;

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="pt-6 pb-4 px-6 bg-gray-900/50">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text
            className="text-xl font-bold text-white"
            numberOfLines={1}
          >
            Task
          </Text>

          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#8b5cf6" />
          </View>
        ) : error ? (
          <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <Text className="text-red-300 font-semibold mb-2">
              Unable to load task
            </Text>
            <Text className="text-gray-400 text-sm mb-3">{error}</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-red-600 rounded-lg py-2 items-center"
            >
              <Text className="text-white font-medium">Go back</Text>
            </TouchableOpacity>
          </View>
        ) : !task ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color="#6B7280"
            />
            <Text className="text-gray-300 font-semibold mt-3">
              Task not found
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {/* Main card: title + status icon + short meta */}
            <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <View className="flex-row items-center mb-3">
                <View className="mr-3">
                  <Ionicons
                    name={isDone ? "checkmark-circle" : "ellipse-outline"}
                    size={28}
                    color={isDone ? "#10B981" : "#9CA3AF"}
                  />
                </View>

                <View className="flex-1">
                  <Text
                    className="text-white font-semibold text-lg"
                    numberOfLines={2}
                  >
                    {task.title}
                  </Text>
                  {task.status?.name ? (
                    <Text className="text-gray-400 text-xs mt-1">
                      {task.status.name}
                    </Text>
                  ) : null}
                </View>
              </View>

              {description ? (
                <Text className="text-gray-300 text-sm mt-1">
                  {description}
                </Text>
              ) : null}
            </View>

            {/* Status */}
            <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="flag-outline" size={18} color="#FBBF24" />
                <Text className="text-gray-300 font-medium ml-2">
                  Status
                </Text>
              </View>
              <Text className="text-gray-100 text-sm">
                {task.status?.name ?? "-"}
              </Text>
            </View>

            {/* Due date */}
            {task.dueDate && (
              <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#9CA3AF"
                  />
                  <Text className="text-gray-300 font-medium ml-2">
                    Due date
                  </Text>
                </View>
                <Text className="text-gray-100 text-sm">
                  {formatDate(task.dueDate)}
                </Text>
              </View>
            )}

            {/* Project link (if available) */}
            {projectTitle && (
              <TouchableOpacity
                className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex-row items-center justify-between"
                onPress={() =>
                  projectId && router.push(`/projects/${projectId}`)
                }
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="folder-outline"
                    size={18}
                    color="#60A5FA"
                  />
                  <Text className="text-gray-300 font-medium ml-2">
                    Project
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-blue-400 text-sm mr-1">
                    {projectTitle}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}