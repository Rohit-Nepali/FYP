import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Task,
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
} from "../services/taskService";
import {
  Status,
  getAllStatuses,
  createStatus,
} from "../services/statusService";
import {
  Priority,
  getAllPriorities,
  createPriority,
} from "../services/priorityService";
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

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState<string>("");
  const [priorityId, setPriorityId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");

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
      if (statusesData.length > 0 && !statusId) setStatusId(statusesData[0].id);
      if (prioritiesData.length > 0 && !priorityId)
        setPriorityId(prioritiesData[0].id);
    } catch (e) {
      showAlert("Error", "Failed to load tasks");
    } finally {
      setLoading(false);
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
  
  const showAlert = (
    title: string,
    message: string,
    buttons?: Array<{ text: string; onPress?: () => void; style?: "default" | "destructive" }>
  ) => setCustomAlert({ visible: true, title, message, buttons });

  const hideAlert = () => setCustomAlert(null);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatusId(task.statusId);
    setPriorityId(task.priorityId);
    setDueDate(task.dueDate || "");
    setModalVisible(true);
  };

  const handleDeleteTask = (id: string) =>
    showAlert("Delete Task", "Delete this task permanently?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTask(id);
          setTasks((prev) => prev.filter((t) => t.id !== id));
        },
      },
    ]);

  const handleToggleStatus = async (task: Task) => {
    const idx = statuses.findIndex((s) => s.id === task.statusId);
    const next = (idx + 1) % statuses.length;
    await updateTask(task.id, { statusId: statuses[next].id });
    loadData();
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";

  // monochrome fallback
  const getChip = (name: string, color?: string) => ({
    name,
    color: color || "#52525B",
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-6 pt-5 pb-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-white">Tasks</Text>
        <View style={{ width: 24 }} />{/* placeholder for symmetry */}
      </View>

      {/* CONTENT */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {tasks.length === 0 ? (
            <View className="items-center py-24">
              <Ionicons name="sparkles-outline" size={56} color="#52525B" />
              <Text className="text-gray-400 mt-4 text-base">
                No tasks yet
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                Tap “＋” below to add one
              </Text>
            </View>
          ) : (
            tasks.map((t) => {
              const pr = getChip(t.priority.name, t.priority.color);
              const st = getChip(t.status.name, t.status.color);
              const isDone =
                t.status.name.toLowerCase().includes("done") ||
                t.status.name.toLowerCase().includes("complete");
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => handleEditTask(t)}
                  className="bg-gray-800 rounded-xl p-4 mb-3 active:opacity-90"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-4">
                      <Text
                        className={`text-gray-100 font-medium tracking-tight ${
                          isDone ? "line-through text-gray-500" : ""
                        }`}
                        numberOfLines={1}
                      >
                        {t.title}
                      </Text>
                      {!!t.description && (
                        <Text
                          numberOfLines={2}
                          className="text-gray-500 text-xs mt-1"
                        >
                          {t.description}
                        </Text>
                      )}
                      <View className="flex-row items-center mt-2 space-x-2">
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: pr.color }}
                        >
                          <Text className="text-[10px] text-white">
                            {pr.name}
                          </Text>
                        </View>
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: st.color }}
                        >
                          <Text className="text-[10px] text-white">
                            {st.name}
                          </Text>
                        </View>
                        {t.dueDate && (
                          <View className="flex-row items-center space-x-1">
                            <Ionicons
                              name="calendar-outline"
                              size={12}
                              color="#a1a1aa"
                            />
                            <Text className="text-[10px] text-gray-400">
                              {formatDate(t.dueDate)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View className="items-end">
                      <TouchableOpacity
                        onPress={() => handleToggleStatus(t)}
                        className="mb-3"
                      >
                        <Ionicons
                          name={
                            isDone
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={22}
                          color={isDone ? "#10B981" : "#8B5CF6"}
                        />
                      </TouchableOpacity>
                      <View className="flex-row space-x-3">
                        <TouchableOpacity onPress={() => handleEditTask(t)}>
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color="#9ca3af"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteTask(t.id)}>
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#ef4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
        className="absolute bottom-8 right-6 bg-[#8B5CF6] p-4 rounded-full shadow-lg active:opacity-90"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* TASK MODAL */}
      <TaskModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
        onSave={async (payload) => {
          if (editingTask) {
            await updateTask(editingTask.id, payload);
          } else {
            await createTask(payload);
          }
          setModalVisible(false);
          loadData();
          return editingTask as Task;
        }}
        initialValues={{
          title,
          description,
          statusId,
          priorityId,
          dueDate,
        }}
        statuses={statuses}
        setStatuses={setStatuses}
        priorities={priorities}
        setPriorities={setPriorities}
      />

      {/* ALERT */}
      {customAlert && (
        <Modal visible transparent animationType="fade" onRequestClose={hideAlert}>
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <View className="bg-gray-900 rounded-xl p-6 w-full max-w-sm">
              <Text className="text-white text-lg font-semibold mb-2 text-center">
                {customAlert.title}
              </Text>
              <Text className="text-gray-400 text-center mb-6">
                {customAlert.message}
              </Text>
              <View className="flex-row space-x-3">
                {customAlert.buttons?.map((b, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      hideAlert();
                      b.onPress?.();
                    }}
                    className={`flex-1 py-3 rounded-xl items-center ${
                      b.style === "destructive" ? "bg-red-600" : "bg-gray-700"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        b.style === "destructive"
                          ? "text-white"
                          : "text-gray-100"
                      }`}
                    >
                      {b.text}
                    </Text>
                  </TouchableOpacity>
                )) || (
                  <TouchableOpacity
                    onPress={hideAlert}
                    className="flex-1 py-3 bg-[#8B5CF6] rounded-xl items-center"
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
  );
}