import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Progress from "react-native-progress";
import { Task, getAllTasks } from "../services/taskService";
import {
  Project as ApiProject,
  getAllProjects,
  getProjectById,
} from "../services/projectService";

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [projects, setProjects] = useState<
    { id: string; name: string; progress: number; color: string }[]
  >([]);

  const colors = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    // load tasks is still needed for the task list
    loadTasks();
  }, []);

  const loadProjects = async () => {
    try {
      const apiProjects: ApiProject[] = await getAllProjects();
      console.log("apiProjects", apiProjects);

      // For each project fetch details to compute progress (tasks)
      const detailed = await Promise.all(
        apiProjects.map(async (p, i) => {
          try {
            const full = await getProjectById(p.id);
            const tasks = full.tasks || [];
            const total = tasks.length;
            const completed = tasks.filter((t: any) => t.status === "COMPLETED").length;
            const progress = total > 0 ? completed / total : 0;
            return {
              id: p.id,
              name: p.title,
              progress,
              color: colors[i % colors.length],
            };
          } catch (err) {
            return {
              id: p.id,
              name: p.title,
              progress: 0,
              color: colors[i % colors.length],
            };
          }
        })
      );

      setProjects(detailed);
    } catch (error) {
      console.error("Failed to load projects", error);
    }
  };

  const loadTasks = async () => {
    try {
      setTaskError(null);
      setLoadingTasks(true);
      const result = await getAllTasks({ limit: 5, page: 1 });
      setTasks(result.tasks);
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Failed to load tasks"
      );
    } finally {
      setLoadingTasks(false);
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
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

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-600";
      case "IN_PROGRESS":
        return "bg-blue-600";
      case "CANCELLED":
        return "bg-gray-600";
      default:
        return "bg-yellow-600";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter(
    (t) => t.status === "IN_PROGRESS"
  ).length;

  return (
    <ProtectedRoute>
      <SafeAreaView className="flex-1 bg-gray-900">
        <ScrollView className="flex-1 px-5">
          {/* Greeting */}
          <Text className="text-white text-lg mt-8">
            Hi <Text className="font-bold">{user?.name || "there"}</Text>!
          </Text>

          <Text className="text-white text-2xl font-bold mt-1 mb-6">
            What's on your plate?
          </Text>

          {/* Projects */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-semibold">Projects</Text>
            <Link href="/">
              <Text className="text-purple-400 text-sm">See All</Text>
            </Link>
          </View>

          <View className="mb-6 space-y-4 border-2 border-white-700 pb-6">
            {projects.map((project, index) => (
              <TouchableOpacity
                key={index}
                className="bg-gray-800 rounded-xl p-4"
              // onPress={() => router.push(`/project/${project.name}`)}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View
                      className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: project.color + "33" }}
                    >
                      <MaterialIcons
                        name="folder"
                        size={20}
                        color={project.color}
                      />
                    </View>
                    <Text className="text-white font-medium">
                      {project.name}
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-sm">
                    {Math.round(project.progress * 100)}%
                  </Text>
                </View>
                <Progress.Bar
                  progress={project.progress}
                  width={null}
                  height={8}
                  color={project.color}
                  unfilledColor="#374151"
                  borderWidth={0}
                  borderRadius={8}
                  className="mt-1"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Tasks on Home */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-semibold">My tasks</Text>
            <Link href="/tasks">
              <Text className="text-purple-400 text-sm">Manage</Text>
            </Link>
          </View>

          <View className="space-y-3 pb-24">
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
              tasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  className="bg-gray-800 rounded-xl p-4 flex-row items-start gap-3"
                  onPress={() => router.push("/tasks")}
                >
                  <View className="mt-1">
                    <Ionicons
                      name={
                        task.status === "COMPLETED"
                          ? "checkmark-circle"
                          : "ellipse-outline"
                      }
                      size={22}
                      color={
                        task.status === "COMPLETED" ? "#10B981" : "#9CA3AF"
                      }
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-3">
                      <Text
                        className={`text-white font-semibold flex-1 ${task.status === "COMPLETED"
                          ? "line-through text-gray-400"
                          : ""
                          }`}
                      >
                        {task.title}
                      </Text>
                      <View
                        className={`px-2 py-1 rounded ${getStatusColor(
                          task.status
                        )}`}
                      >
                        <Text className="text-white text-xs font-medium">
                          {task.status.replace("_", " ")}
                        </Text>
                      </View>
                    </View>
                    {task.description ? (
                      <Text className="text-gray-400 text-sm mt-1">
                        {task.description}
                      </Text>
                    ) : null}
                    <View className="flex-row items-center gap-2 mt-2">
                      <View
                        className={`px-2 py-1 rounded ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        <Text className="text-white text-xs font-medium">
                          {task.priority}
                        </Text>
                      </View>
                      {task.dueDate ? (
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
                      ) : null}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
