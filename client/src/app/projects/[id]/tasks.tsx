import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import TaskModal from "@/src/components/UI/modals/TaskModal";
import { getProjectById, Project } from "@/src/services/projectService";
import { getAllStatuses, Status } from "@/src/services/statusService";
import { getAllPriorities, Priority } from "@/src/services/priorityService";
import { createTask } from "@/src/services/taskService";
import { Button } from "@/src/components/UI/Buttons";

interface ProjectDetail extends Project {
  tasks?: any[];
}

export default function ProjectTasks() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadProjectDetail(id);
    }
    loadStatusesAndPriorities();
  }, [id]);

  const loadProjectDetail = async (projectId: string) => {
    try {
      setLoading(true);
      const data = await getProjectById(projectId);
      setProject(data);
    } catch (err) {
      console.error("Failed to load project", err);
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to load project"
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadStatusesAndPriorities = async () => {
    if (!id || typeof id !== "string") return;
    try {
      const [statusesData, prioritiesData] = await Promise.all([
        getAllStatuses(id),
        getAllPriorities(id),
      ]);
      setStatuses(statusesData);
      setPriorities(prioritiesData);
      if (statusesData.length > 0) setSelectedStatus(statusesData[0].id);
      if (prioritiesData.length > 0) setSelectedPriority(prioritiesData[0].id);
    } catch (err) {
      console.error("Failed to load statuses/priorities", err);
    }
  };

  const resetModal = () => {
    setModalVisible(false);
    setTaskTitle("");
    setTaskDescription("");
    if (statuses.length > 0) setSelectedStatus(statuses[0].id);
    if (priorities.length > 0) setSelectedPriority(priorities[0].id);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#60A5FA" />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-white text-lg mt-4">Project not found</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="primary"
            className="mt-6"
          />
        </View>
      </SafeAreaView>
    );
  }

  const taskCount = project.tasks?.length || 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="pt-6 pb-4 px-6 bg-gray-900/50 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text
            className="text-lg font-semibold text-white flex-1 ml-4"
            numberOfLines={1}
          >
            {project.title} - Tasks
          </Text>

          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Tasks list */}
        <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-semibold text-base">
              Tasks
            </Text>
            <Text className="text-gray-500 text-xs">
              {taskCount} total
            </Text>
          </View>

          {taskCount === 0 ? (
            <View className="items-center py-8">
              <Ionicons
                name="checkmark-done-outline"
                size={40}
                color="#6B7280"
              />
              <Text className="text-gray-400 text-sm mt-2">
                No tasks yet
              </Text>
              <Text className="text-gray-500 text-xs mt-1 text-center">
                Add a task to get started.
              </Text>
            </View>
          ) : (
            <View className="space-y-2">
              {project.tasks!.slice(0, 10).map((task: any, index: number) => {
                const isDone = Boolean(task.isCompleted);

                return (
                  <TouchableOpacity
                    key={task.id || index}
                    className="flex-row items-center bg-gray-900/60 rounded-xl px-3 py-3"
                    onPress={() =>
                      task.id && router.push(`/tasks/${task.id}`)
                    }
                  >
                    <Ionicons
                      name={isDone ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={isDone ? "#10B981" : "#9CA3AF"}
                    />

                    <View className="flex-1 ml-3">
                      <Text
                        className={`text-sm font-medium text-white ${isDone ? "line-through text-gray-400" : ""
                          }`}
                        numberOfLines={1}
                      >
                        {task.title}
                      </Text>

                      <View className="flex-row items-center mt-1">
                        {task.priority?.name && (
                          <View className="px-2 py-0.5 rounded-full bg-gray-800 mr-2">
                            <Text className="text-gray-300 text-xs">
                              {task.priority.name}
                            </Text>
                          </View>
                        )}

                        {task.dueDate && (
                          <View className="flex-row items-center">
                            <Ionicons
                              name="calendar-outline"
                              size={12}
                              color="#9CA3AF"
                            />
                            <Text className="text-gray-400 text-xs ml-1">
                              {formatDate(task.dueDate)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom bar with Add Task */}
      <View className="border-t border-gray-800 bg-gray-900 px-4 py-3 mb-24">
        <Button
          title="Add Task"
          onPress={() => setModalVisible(true)}
          variant="primary"
          icon="add-outline"
        />
      </View>

      {/* Create Task Modal */}
      <TaskModal
        visible={modalVisible}
        onClose={resetModal}
        onSave={async (payload) => {
          try {
            setSavingTask(true);
            const task = await createTask({ ...payload, projectId: id as string });
            Alert.alert("Success", "Task created successfully");
            resetModal();
            loadProjectDetail(id as string);
            return task;
          } catch (err) {
            Alert.alert(
              "Error",
              err instanceof Error ? err.message : "Failed to create task"
            );
            throw err;
          } finally {
            setSavingTask(false);
          }
        }}
        initialValues={{
          title: taskTitle,
          description: taskDescription,
          statusId: selectedStatus,
          priorityId: selectedPriority,
        }}
        statuses={statuses}
        setStatuses={setStatuses}
        priorities={priorities}
        setPriorities={setPriorities}
        projectId={id as string}
      />
    </SafeAreaView>
  );
}