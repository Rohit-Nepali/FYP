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
    // load tasks is still needed for the task list
    loadTasks();
  }, []);

  const loadProjects = async () => {
    try {
      setProjectError(null);
      setLoadingProjects(true);

      // const result = await getAllProjects({ limit: 5, page: 1 });
      // setProjects(result.projects);
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
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView className="flex-1 px-4 ">
        {/* Greeting */}
        <Text className="text-white font-bold text-xl mt-4">
          Hi <Text className="font-bold text-2xl">{user?.name?.split(' ')[0] || "there"}</Text> !
        </Text>
 
        <Text className="text-white text-2xl font-bold mt-2 mb-6">
          What's on your plate?
        </Text>

        {/* Projects */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-lg font-semibold">Projects</Text>
          <Link href="/projects/page">
            <Text className="text-purple-400 text-sm">See All</Text>
          </Link>
        </View>

        <View className="mb-6 space-y-4 pb-6">
          {loadingProjects ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
          ) : projectError ? (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <Text className="text-red-300 font-semibold mb-2">
                Unable to load projects
              </Text>
              <Text className="text-gray-400 text-sm mb-3">{projectError}</Text>
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
            projects.map((project) => (
              <View key={project.id} className="bg-gray-800 rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold flex-1">
                    {project.name}
                  </Text>
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                </View>
                <Progress.Bar
                  progress={project.progress / 100}
                  width={null}
                  color={project.color}
                  unfilledColor="#374151"
                  borderWidth={0}
                  height={6}
                />
                <Text className="text-gray-400 text-xs mt-2">
                  {project.progress}% Complete
                </Text>
              </View>
            ))
          )}
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
                  <View className="flex-row items-start justify-between gap-3">
                    <Text
                      className={`text-white font-semibold flex-1 ${task.status.name.toLowerCase().includes("complete") ||
                        task.status.name.toLowerCase().includes("done")
                        ? "line-through text-gray-400"
                        : ""
                        }`}
                    >
                      {task.title}
                    </Text>
                    <View
                      className="px-2 py-1 rounded"
                      style={getStatusColor(task.status)}
                    >
                      <Text className="text-white text-xs font-medium">
                        {task.status.name}
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
                      className="px-2 py-1 rounded"
                      style={getPriorityColor(task.priority)}
                    >
                      <Text className="text-white text-xs font-medium">
                        {task.priority.name}
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
  );
}
