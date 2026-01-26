import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Task, getAllTasks } from "../services/taskService";
import { getAllProjects, Project, createProject } from "../services/projectService";

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
    { id: string; title: string; progress: number; color: string }[]
  >([]);

  // Project creation modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);

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

  const handleCreateProject = async () => {
    if (!projectTitle.trim()) {
      Alert.alert("Error", "Project title is required");
      return;
    }

    try {
      setCreating(true);
      await createProject({
        title: projectTitle.trim(),
        description: projectDescription.trim(),
      });

      // Reset form
      setProjectTitle("");
      setProjectDescription("");
      setCreateModalVisible(false);

      // Reload projects
      await loadProjects();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

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

                  <TouchableOpacity
                    onPress={() => setCreateModalVisible(true)}
                    className="mt-4 bg-purple-600 rounded-lg px-6 py-3"
                  >
                    <Text className="text-white font-medium">Create Project</Text>
                  </TouchableOpacity>
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
                        {project.title}
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
            {/* make this see ALL projects button full width of content */}
            {!loadingProjects && !projectError && projects.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push("/projects/page")}
                className="mt-3 w-full flex-row items-center justify-center py-3 px-4 rounded-xl bg-purple-700"
              >
                <Text className="text-white text-sm font-semibold">
                  See All Projects
                </Text>
                <Ionicons name="chevron-forward" size={18} color="white" className="pl-2" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tasks on Home */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-lg font-semibold">Recent tasks</Text>
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
                className="mt-3 w-full flex-row items-center justify-center py-3 px-4 rounded-xl bg-purple-600"
              >
                <Text className="text-white text-sm font-semibold">
                  See All Tasks
                </Text>
                <Ionicons name="chevron-forward" size={18} color="white" className="pl-2" />
              </TouchableOpacity>
            )}
          </View>
        </View>


      </ScrollView>

      {/* Project Creation Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-gray-800 rounded-2xl p-6 mx-4 w-full max-w-sm">
            <Text className="text-white text-xl font-bold mb-4">
              Create New Project
            </Text>

            <Text className="text-gray-400 text-sm mb-2">Project Title *</Text>
            <TextInput
              value={projectTitle}
              onChangeText={setProjectTitle}
              placeholder="Enter project title"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-4"
            />

            <Text className="text-gray-400 text-sm mb-2">Description (Optional)</Text>
            <TextInput
              value={projectDescription}
              onChangeText={setProjectDescription}
              placeholder="Enter project description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-6 h-20"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                className="flex-1 bg-gray-600 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateProject}
                disabled={creating}
                className="flex-1 bg-purple-600 rounded-lg py-3 items-center"
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-medium">Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView >
  );
}
