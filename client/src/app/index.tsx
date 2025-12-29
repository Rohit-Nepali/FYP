import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Task, getAllTasks } from "../services/taskService";
import { getAllProjects, Project } from "../services/projectService";

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);

  const [projects, setProjects] = useState<
    { id: string; name: string; progress: number; color: string }[]
  >([]);

  const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadProjects = async () => {
    try {
      setProjectError(null);
      setLoadingProjects(true);
      const result = await getAllProjects();
      setProjects(result as any[]);
    } catch (error) {
      setProjectError(
        error instanceof Error ? error.message : "Failed to load projects"
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadTasks = async () => {
    try {
      setTaskError(null);
      setLoadingTasks(true);
      const result = await getAllTasks({ limit: 4, page: 1 });
      setTasks(result.tasks);
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Failed to load tasks"
      );
    } finally {
      setLoadingTasks(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadProjects(), loadTasks()]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900" >
      <ScrollView className="flex-1 px-4 " refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#8b5cf6"]}
          tintColor="#8b5cf6"
        />
      }>
        {/* Greeting */}
        <Text className="text-white font-bold text-xl mt-4">
          Hi <Text className="font-bold text-2xl">{user?.name?.split(' ')[0] || "there"}</Text> !
        </Text>

        <Text className="text-white text-2xl font-bold mt-2 mb-6">
          What's on your plate?
        </Text>

        {/* Tasks on Home */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-lg font-semibold">My tasks</Text>
        </View>
        <View className="mb-2">
          <View className="border border-gray-700 rounded-2xl p-4 bg-gray-900/60">
            <View className="space-y-3 pb-2">
              {loadingTasks ? (
                <View className="py-10 items-center justify-center">
                  <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
              ) : taskError ? (
                <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <Text className="text-red-300 font-semibold mb-2">
                    Unable to load tasks
                  </Text>
                  <Text className="text-gray-400 text-sm mb-3">{taskError}</Text>
                  <TouchableOpacity
                    onPress={loadTasks}
                    className="bg-red-600 rounded-lg py-2 items-center"
                  >
                    <Text className="text-white font-medium">Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : tasks.length === 0 ? (
                <View className="py-12 items-center justify-center bg-gray-800 rounded-xl">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={48}
                    color="#6B7280"
                  />
                  <Text className="text-gray-300 font-semibold mt-3">
                    You're all caught up
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1 text-center px-6">
                    Create a new task to get started.
                  </Text>
                </View>
              ) : (
                tasks.slice(0, 4).map((task, index) => (
                  < TouchableOpacity
                    key={task.id}
                    className="bg-gray-800 rounded-xl p-4 flex-row items-start gap-3 mb-2"
                    onPress={() => router.push(`/tasks/${task.id}`)}
                  >
                    <View>
                      <Ionicons
                        name={
                          task.status.name.toLowerCase().includes("complete") ||
                            task.status.name.toLowerCase().includes("done")
                            ? "checkmark-circle"
                            : "ellipse-outline"
                        }
                        size={22}
                        color={
                          task.status.name.toLowerCase().includes("complete") ||
                            task.status.name.toLowerCase().includes("done")
                            ? "#10B981"
                            : "#9CA3AF"
                        }
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-white font-semibold ${task.status.name.toLowerCase().includes("complete") ||
                          task.status.name.toLowerCase().includes("done")
                          ? "line-through text-gray-400"
                          : ""
                          }`}
                      >
                        {task.title}
                      </Text>
                      {task.dueDate ? (
                        <View className="flex-row items-center gap-2 mt-2">
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color="#9CA3AF"
                          />
                          <Text className="text-gray-400 text-xs">
                            {formatDate(task.dueDate)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* See All tasks button linking to project page */}
            {!loadingTasks && !taskError && tasks.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push("/tasks")}
                className="mt-3 self-end flex-row items-center"
              >
                <Text className="text-purple-400 text-xs font-medium mr-1">
                  See All Tasks
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Projects */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-lg font-semibold">Projects</Text>
        </View>

        <View className="mb-6">
          <View className="border border-gray-700 rounded-2xl p-4 bg-gray-900/60">
            <View className="space-y-4">
              {loadingProjects ? (
                <View className="py-10 items-center justify-center">
                  <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
              ) : projectError ? (
                <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <Text className="text-red-300 font-semibold mb-2">
                    Unable to load projects
                  </Text>
                  <Text className="text-gray-400 text-sm mb-3">
                    {projectError}
                  </Text>
                  <TouchableOpacity
                    onPress={loadProjects}
                    className="bg-red-600 rounded-lg py-2 items-center"
                  >
                    <Text className="text-white font-medium">Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : projects.length === 0 ? (
                <View className="py-12 items-center justify-center bg-gray-800 rounded-xl">
                  <Ionicons
                    name="folder-open-outline"
                    size={48}
                    color="#6B7280"
                  />
                  <Text className="text-gray-300 font-semibold mt-3">
                    No projects yet
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1 text-center px-6">
                    Create your first project to organize your tasks.
                  </Text>
                </View>
              ) : (
                projects.slice(0, 2).map((project, index) => (
                  <TouchableOpacity
                    key={`${project.id ?? "project"}-${index}`}
                    className="bg-gray-800 rounded-xl p-4 flex-row items-start gap-3 mb-2"
                    onPress={() => router.push(`/projects/${project.id}`)}
                  >
                    <View>
                      <Ionicons
                        name="folder"
                        size={22}
                        color={project.color || "#9CA3AF"}
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-white font-semibold">
                        {project.title || project.name}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* See All tasks button linking to project page */}
            {!loadingProjects && !projectError && projects.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push("/projects/page")}
                className="mt-3 self-end flex-row items-center"
              >
                <Text className="text-purple-400 text-xs font-medium mr-1">
                  See All Projects
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView >
  );
}
