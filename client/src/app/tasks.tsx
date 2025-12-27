import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
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
import { Status, getAllStatuses, createStatus } from "../services/statusService";
import { Priority, getAllPriorities, createPriority } from "../services/priorityService";
import { SafeAreaView } from "react-native-safe-area-context";
import TaskModal from "../components/UI/TaskModal";

export default function TasksScreen() {
  const router = useRouter();
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
  const [saving, setSaving] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [newPriorityName, setNewPriorityName] = useState("");

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
      Alert.alert("Validation", "Please enter a task title");
      return;
    }

    if (!statusId) {
      Alert.alert("Validation", "Please select a status");
      return;
    }

    if (!priorityId) {
      Alert.alert("Validation", "Please select a priority");
      return;
    }

    try {
      setSaving(true);
      if (editingTask) {
        await updateTask(editingTask.id, {
          title,
          description: description || undefined,
          statusId,
          priorityId,
          dueDate: dueDate || undefined,
        });
        Alert.alert("Success", "Task updated successfully");
      } else {
        await createTask({
          title,
          description: description || undefined,
          statusId,
          priorityId,
          dueDate: dueDate || undefined,
        });
        Alert.alert("Success", "Task created successfully");
      }
      resetForm();
      setModalVisible(false);
      loadData();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save task"
      );
    } finally {
      setSaving(false);
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
              // Remove task from list immediately for better UX
              setTasks((prev) => prev.filter((t) => t.id !== taskId));
              await deleteTask(taskId);
              showCustomAlert("Success", "Task deleted successfully");
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

  const handleCreateStatus = async () => {
    if (!newStatusName.trim()) {
      Alert.alert("Error", "Status name is required");
      return;
    }
    try {
      const newStatus = await createStatus({ name: newStatusName.trim() });
      setStatuses((prev) => [...prev, newStatus]);
      setStatusId(newStatus.id);
      setStatusModalVisible(false);
      setNewStatusName("");
      Alert.alert("Success", "Status added!");
    } catch (err) {
      Alert.alert("Error", "Failed to create status");
    }
  };

  const handleCreatePriority = async () => {
    if (!newPriorityName.trim()) {
      Alert.alert("Error", "Priority name is required");
      return;
    }
    try {
      const newPriority = await createPriority({ name: newPriorityName.trim() });
      setPriorities((prev) => [...prev, newPriority]);
      setPriorityId(newPriority.id);
      setPriorityModalVisible(false);
      setNewPriorityName("");
      Alert.alert("Success", "Priority added!");
    } catch (err) {
      Alert.alert("Error", "Failed to create priority");
    }
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
                <TouchableOpacity
                  key={task.id}
                  className="bg-gray-800 rounded-xl px-4 py-3 mb-2"
                  onPress={() => router.push(`/tasks/${task.id}`)}
                >
                  {/* Top row */}
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row flex-1 items-start">
                      {/* Status toggle */}
                      <TouchableOpacity
                        onPress={() => handleToggleStatus(task)}
                        className="mt-1 mr-3"
                      >
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
                              : "#6B7280"
                          }
                        />
                      </TouchableOpacity>

                      {/* Title + meta */}
                      <View className="flex-1">
                        <Text
                          className={`text-base text-gray-200 ${task.status.name.toLowerCase().includes("complete") ||
                            task.status.name.toLowerCase().includes("done")
                            ? "line-through opacity-50"
                            : ""
                            }`}
                        >
                          {task.title}
                        </Text>

                        {task.description && (
                          <Text className="text-gray-500 text-xs mt-1">
                            {task.description}
                          </Text>
                        )}

                        {/* Meta row */}
                        <View className="flex-row items-center gap-2 mt-2">
                          <View
                            className="px-2 py-0.5 rounded"
                            style={getPriorityColor(task.priority)}
                          >
                            <Text className="text-white text-[10px] font-medium">
                              {task.priority.name}
                            </Text>
                          </View>

                          {task.dueDate && (
                            <View className="flex-row items-center">
                              <Ionicons
                                name="calendar-outline"
                                size={12}
                                color="#6B7280"
                              />
                              <Text className="text-gray-500 text-[10px] ml-1">
                                {formatDate(task.dueDate)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Action icons */}
                    <View className="flex-row items-center gap-3 ml-2">
                      <TouchableOpacity onPress={() => handleEditTask(task)}>
                        <Ionicons name="pencil-outline" size={18} color="#9CA3AF" />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => handleDeleteTask(task.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}

        {/* Create/Edit Task Modal */}
        <TaskModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            resetForm();
          }}
          onSave={async (payload) => {
            if (editingTask) {
              await updateTask(editingTask.id, payload);
              Alert.alert("Success", "Task updated successfully");
            } else {
              await createTask(payload);
              Alert.alert("Success", "Task created successfully");
            }
            resetForm();
            setModalVisible(false);
            loadData();
          }}
          initialValues={{
            title: title,
            description: description,
            statusId: statusId,
            priorityId: priorityId,
            dueDate: dueDate,
          }}
          statuses={statuses}
          setStatuses={setStatuses}
          priorities={priorities}
          setPriorities={setPriorities}
        />

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
                      className={`flex-1 rounded-xl py-3 items-center ${button.style === "destructive"
                        ? "bg-red-600"
                        : "bg-gray-700"
                        }`}
                    >
                      <Text
                        className={`font-medium ${button.style === "destructive"
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
                        className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
                      >
                        <Text className="text-white font-medium">OK</Text>
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </ProtectedRoute>
  );
}
