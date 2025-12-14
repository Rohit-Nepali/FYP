import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
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
import { Status, getAllStatuses } from "../services/statusService";
import { Priority, getAllPriorities } from "../services/priorityService";
import { theme } from "../config/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TasksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatusId, setFilterStatusId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState<string>("");
  const [priorityId, setPriorityId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: "default" | "destructive";
    }>;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [filterStatusId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksResult, statusesData, prioritiesData] = await Promise.all([
        getAllTasks(filterStatusId ? { statusId: filterStatusId } : {}),
        getAllStatuses(),
        getAllPriorities(),
      ]);
      setTasks(tasksResult.tasks);
      setStatuses(statusesData);
      setPriorities(prioritiesData);

      // Set default status and priority if not set
      if (statusesData.length > 0 && !statusId) {
        setStatusId(statusesData[0].id);
      }
      if (prioritiesData.length > 0 && !priorityId) {
        setPriorityId(prioritiesData[0].id);
      }
    } catch (error) {
      showCustomAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      showCustomAlert("Error", "Please enter a task title");
      return;
    }

    if (!statusId) {
      showCustomAlert("Error", "Please select a status");
      return;
    }

    if (!priorityId) {
      showCustomAlert("Error", "Please select a priority");
      return;
    }

    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title,
          description: description || undefined,
          statusId,
          priorityId,
          dueDate: dueDate || undefined,
        });
        showCustomAlert("Success", "Task updated successfully");
      } else {
        await createTask({
          title,
          description: description || undefined,
          statusId,
          priorityId,
          dueDate: dueDate || undefined,
        });
        showCustomAlert("Success", "Task created successfully");
      }
      resetForm();
      setModalVisible(false);
      loadData();
    } catch (error) {
      showCustomAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to save task"
      );
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatusId(task.statusId);
    setPriorityId(task.priorityId);
    setDueDate(task.dueDate || "");
    setModalVisible(true);
  };

  const handleDeleteTask = (taskId: string) => {
    showCustomAlert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "default" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask(taskId);
              showCustomAlert("Success", "Task deleted successfully");
              // loadTasks();
            } catch (error) {
              showCustomAlert(
                "Error",
                error instanceof Error ? error.message : "Failed to delete task"
              );
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (task: Task) => {
    // Cycle to next status
    const currentIndex = statuses.findIndex((s) => s.id === task.statusId);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const newStatusId = statuses[nextIndex].id;

    try {
      await updateTask(task.id, { statusId: newStatusId });
      loadData();
    } catch (error) {
      showCustomAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to update task"
      );
    }
  };

  const resetForm = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    if (statuses.length > 0) setStatusId(statuses[0].id);
    if (priorities.length > 0) setPriorityId(priorities[0].id);
    setDueDate("");
  };

  const getPriorityColor = (priority: Priority) => {
    if (priority.color) {
      return { backgroundColor: priority.color };
    }
    return { backgroundColor: "#6B7280" };
  };

  const getStatusColor = (status: Status) => {
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

  const showCustomAlert = (
    title: string,
    message: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: "default" | "destructive";
    }>
  ) => {
    setCustomAlert({ visible: true, title, message, buttons });
  };

  const hideCustomAlert = () => {
    setCustomAlert(null);
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
            <View className="flex-row gap-2 flex-wrap">
              <TouchableOpacity
                onPress={() => setFilterStatusId(null)}
                className={`px-4 py-2 rounded-lg ${
                  filterStatusId === null ? "bg-blue-700" : "bg-gray-800"
                }`}
              >
                <Text className="text-white text-sm font-medium">All</Text>
              </TouchableOpacity>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status.id}
                  onPress={() => setFilterStatusId(status.id)}
                  className={`px-4 py-2 rounded-lg ${
                    filterStatusId === status.id ? "bg-blue-700" : "bg-gray-800"
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
                                task.status.name
                                  .toLowerCase()
                                  .includes("complete") ||
                                task.status.name.toLowerCase().includes("done")
                                  ? "checkmark-circle"
                                  : "ellipse-outline"
                              }
                              size={24}
                              color={
                                task.status.name
                                  .toLowerCase()
                                  .includes("complete") ||
                                task.status.name.toLowerCase().includes("done")
                                  ? "#10B981"
                                  : "#9CA3AF"
                              }
                            />
                          </TouchableOpacity>
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
                          <Text className="text-gray-400 text-sm ml-8 mb-2">
                            {task.description}
                          </Text>
                        )}
                        <View className="flex-row items-center gap-2 ml-8">
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
                    <View className="flex-row justify-end gap-3 mt-3 ml-8">
                      <TouchableOpacity
                        onPress={() => handleEditTask(task)}
                        className="px-3 py-1 bg-blue-700 rounded-lg"
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
                      {statuses.map((s) => (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => setStatusId(s.id)}
                          className={`px-4 py-2 rounded-lg ${
                            statusId === s.id ? "bg-blue-700" : "bg-gray-800"
                          }`}
                          style={
                            statusId === s.id && s.color
                              ? { backgroundColor: s.color }
                              : undefined
                          }
                        >
                          <Text className="text-white text-sm">{s.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-300 mb-2 font-medium">
                      Priority
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {priorities.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => setPriorityId(p.id)}
                          className={`px-4 py-2 rounded-lg ${
                            priorityId === p.id ? "bg-blue-700" : "bg-gray-800"
                          }`}
                          style={
                            priorityId === p.id && p.color
                              ? { backgroundColor: p.color }
                              : undefined
                          }
                        >
                          <Text className="text-white text-sm">{p.name}</Text>
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
                    className="bg-blue-700 rounded-xl py-4 items-center mb-4"
                  >
                    <Text className="text-white font-bold text-lg">
                      {editingTask ? "Update Task" : "Create Task"}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </LinearGradient>
            </View>
          </Modal>

          {/* Custom Alert Modal */}
          {customAlert && (
            <Modal
              visible={customAlert.visible}
              animationType="fade"
              transparent={true}
              onRequestClose={hideCustomAlert}
            >
              <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <View className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
                  <Text className="text-white text-xl font-bold mb-2 text-center">
                    {customAlert.title}
                  </Text>
                  <Text className="text-gray-300 text-center mb-6">
                    {customAlert.message}
                  </Text>

                  <View className="flex-row gap-3">
                    {customAlert.buttons?.map((button, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          hideCustomAlert();
                          button.onPress?.();
                        }}
                        className={`flex-1 rounded-xl py-3 items-center ${
                          button.style === "destructive"
                            ? "bg-red-600"
                            : "bg-gray-700"
                        }`}
                      >
                        <Text
                          className={`font-medium ${
                            button.style === "destructive"
                              ? "text-white"
                              : "text-gray-200"
                          }`}
                        >
                          {button.text}
                        </Text>
                      </TouchableOpacity>
                    )) || (
                      <TouchableOpacity
                        onPress={hideCustomAlert}
                        className="flex-1 bg-blue-700 rounded-xl py-3 items-center"
                      >
                        <Text className="text-white font-medium">OK</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </LinearGradient>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
