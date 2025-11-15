import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import {
  Task,
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
} from "../services/taskService";
import { theme } from "../config/theme";
import { SafeAreaView } from "react-native-safe-area-context";

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export default function TasksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    loadTasks();
  }, [filterStatus]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterStatus !== "all") {
        filters.status = filterStatus;
      }
      const result = await getAllTasks(filters);
      setTasks(result.tasks);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }

    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title,
          description: description || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
        });
        Alert.alert("Success", "Task updated successfully");
      } else {
        await createTask({
          title,
          description: description || undefined,
          status,
          priority,
          dueDate: dueDate || undefined,
        });
        Alert.alert("Success", "Task created successfully");
      }
      resetForm();
      setModalVisible(false);
      loadTasks();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save task"
      );
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate || "");
    setModalVisible(true);
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTask(taskId);
            Alert.alert("Success", "Task deleted successfully");
            loadTasks();
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "Failed to delete task"
            );
          }
        },
      },
    ]);
  };

  const handleToggleStatus = async (task: Task) => {
    let newStatus: TaskStatus;
    if (task.status === "TODO") {
      newStatus = "IN_PROGRESS";
    } else if (task.status === "IN_PROGRESS") {
      newStatus = "COMPLETED";
    } else if (task.status === "COMPLETED") {
      newStatus = "TODO";
    } else {
      newStatus = "TODO";
    }

    try {
      await updateTask(task.id, { status: newStatus });
      loadTasks();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update task"
      );
    }
  };

  const resetForm = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setPriority("MEDIUM");
    setDueDate("");
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
              <Text className="text-xl font-bold text-white">My Tasks</Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setModalVisible(true);
                }}
              >
                <Ionicons name="add-circle" size={28} color="#60A5FA" />
              </TouchableOpacity>
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
                    Create a new task to get started
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
                          <TouchableOpacity
                            onPress={() => handleToggleStatus(task)}
                            className="mr-2"
                          >
                            <Ionicons
                              name={
                                task.status === "COMPLETED"
                                  ? "checkmark-circle"
                                  : "ellipse-outline"
                              }
                              size={24}
                              color={
                                task.status === "COMPLETED"
                                  ? "#10B981"
                                  : "#9CA3AF"
                              }
                            />
                          </TouchableOpacity>
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
                          <Text className="text-gray-400 text-sm ml-8 mb-2">
                            {task.description}
                          </Text>
                        )}
                        <View className="flex-row items-center gap-2 ml-8">
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
                    <View className="flex-row justify-end gap-3 mt-3 ml-8">
                      <TouchableOpacity
                        onPress={() => handleEditTask(task)}
                        className="px-3 py-1 bg-blue-600 rounded-lg"
                      >
                        <Text className="text-white text-sm">Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteTask(task.id)}
                        className="px-3 py-1 bg-red-600 rounded-lg"
                      >
                        <Text className="text-white text-sm">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* Create/Edit Task Modal */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
              setModalVisible(false);
              resetForm();
            }}
          >
            <View className="flex-1 justify-end bg-black/50">
              <LinearGradient
                colors={["#1F2937", "#111827"]}
                className="rounded-t-3xl p-6 max-h-[90%]"
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-2xl font-bold text-white">
                    {editingTask ? "Edit Task" : "New Task"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
                    <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <ScrollView>
                  <View className="mb-4">
                    <Text className="text-gray-300 mb-2 font-medium">
                      Title *
                    </Text>
                    <TextInput
                      className="bg-gray-800 rounded-xl px-4 py-3 text-gray-200 border border-gray-700"
                      placeholder="Enter task title"
                      placeholderTextColor="#6B7280"
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-300 mb-2 font-medium">
                      Description
                    </Text>
                    <TextInput
                      className="bg-gray-800 rounded-xl px-4 py-3 text-gray-200 border border-gray-700 min-h-[100px]"
                      placeholder="Enter task description"
                      placeholderTextColor="#6B7280"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-300 mb-2 font-medium">
                      Status
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {(
                        [
                          "TODO",
                          "IN_PROGRESS",
                          "COMPLETED",
                          "CANCELLED",
                        ] as TaskStatus[]
                      ).map((s) => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => setStatus(s)}
                          className={`px-4 py-2 rounded-lg ${
                            status === s ? "bg-blue-600" : "bg-gray-800"
                          }`}
                        >
                          <Text className="text-white text-sm">
                            {s.replace("_", " ")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-300 mb-2 font-medium">
                      Priority
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {(
                        ["LOW", "MEDIUM", "HIGH", "URGENT"] as TaskPriority[]
                      ).map((p) => (
                        <TouchableOpacity
                          key={p}
                          onPress={() => setPriority(p)}
                          className={`px-4 py-2 rounded-lg ${
                            priority === p ? "bg-blue-600" : "bg-gray-800"
                          }`}
                        >
                          <Text className="text-white text-sm">{p}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View className="mb-6">
                    <Text className="text-gray-300 mb-2 font-medium">
                      Due Date
                    </Text>
                    <TextInput
                      className="bg-gray-800 rounded-xl px-4 py-3 text-gray-200 border border-gray-700"
                      placeholder="YYYY-MM-DD (optional)"
                      placeholderTextColor="#6B7280"
                      value={dueDate}
                      onChangeText={setDueDate}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleCreateTask}
                    className="bg-blue-600 rounded-xl py-4 items-center mb-4"
                  >
                    <Text className="text-white font-bold text-lg">
                      {editingTask ? "Update Task" : "Create Task"}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </LinearGradient>
            </View>
          </Modal>
        </LinearGradient>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
