import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { theme } from "../../config/theme";
import { getProjectById, Project } from "../../services/projectService";
import { createTask } from "../../services/taskService";
import { getAllStatuses, Status, createStatus } from "../../services/statusService";
import { getAllPriorities, Priority, createPriority } from "../../services/priorityService";

interface ProjectDetail extends Project {
  tasks?: any[];
}

export default function ProjectDetail() {
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

  // New states for mini-modals
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [newPriorityName, setNewPriorityName] = useState("");

  useEffect(() => {
    if (id && typeof id === "string") {
      loadProjectDetail(id);
    }
    loadStatuesAndPriorities();
  }, [id]);

  const loadStatuesAndPriorities = async () => {
    try {
      const [statusesData, prioritiesData] = await Promise.all([
        getAllStatuses(),
        getAllPriorities(),
      ]);
      setStatuses(statusesData);
      setPriorities(prioritiesData);
      if (statusesData.length > 0) setSelectedStatus(statusesData[0].id);
      if (prioritiesData.length > 0) setSelectedPriority(prioritiesData[0].id);
    } catch (err) {
      console.error("Failed to load statuses/priorities", err);
    }
  };

  const loadProjectDetail = async (projectId: string) => {
    try {
      setLoading(true);
      const data = await getProjectById(projectId);
      setProject(data);
    } catch (err) {
      console.error("Failed to load project", err);
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to load project");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert("Validation", "Please enter a task title");
      return;
    }

    if (!selectedStatus) {
      Alert.alert("Validation", "Please select a status");
      return;
    }

    if (!selectedPriority) {
      Alert.alert("Validation", "Please select a priority");
      return;
    }

    try {
      setSavingTask(true);
      await createTask({
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        statusId: selectedStatus,
        priorityId: selectedPriority,
        projectId: id as string,
      });
      Alert.alert("Success", "Task created successfully");
      resetModal();
      loadProjectDetail(id as string);
    } catch (err) {
      console.error("Failed to create task", err);
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSavingTask(false);
    }
  };

  const resetModal = () => {
    setModalVisible(false);
    setTaskTitle("");
    setTaskDescription("");
    if (statuses.length > 0) setSelectedStatus(statuses[0].id);
    if (priorities.length > 0) setSelectedPriority(priorities[0].id);
  };

  // Handler for creating new status
  const handleCreateStatus = async () => {
    if (!newStatusName.trim()) {
      Alert.alert("Error", "Status name is required");
      return;
    }
    try {
      const newStatus = await createStatus({
        name: newStatusName.trim(),
        // Add other fields if needed, e.g., color: "#FF0000", projectId: id
      });
      setStatuses([...statuses, newStatus]); // Optimistically update list
      setSelectedStatus(newStatus.id); // Auto-select it
      setStatusModalVisible(false);
      setNewStatusName("");
      Alert.alert("Success", "Status added!");
    } catch (err) {
      Alert.alert("Error", "Failed to create status");
    }
  };

  // Handler for creating new priority
  const handleCreatePriority = async () => {
    if (!newPriorityName.trim()) {
      Alert.alert("Error", "Priority name is required");
      return;
    }
    try {
      const newPriority = await createPriority({
        name: newPriorityName.trim(),
        // Add other fields if needed, e.g., level: 1, projectId: id
      });
      setPriorities([...priorities, newPriority]); // Optimistically update list
      setSelectedPriority(newPriority.id); // Auto-select it
      setPriorityModalVisible(false);
      setNewPriorityName("");
      Alert.alert("Success", "Priority added!");
    } catch (err) {
      Alert.alert("Error", "Failed to create priority");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <SafeAreaView className="flex-1 bg-gray-900">
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#60A5FA" />
          </View>
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <SafeAreaView className="flex-1 bg-gray-900">
          <View className="flex-1 justify-center items-center px-6">
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text className="text-white text-lg mt-4">Project not found</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-6 bg-blue-600 rounded-lg px-6 py-3"
            >
              <Text className="text-white font-semibold">Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

              <Text className="text-xl font-bold text-white flex-1 ml-4">
                Project Details
              </Text>

              <TouchableOpacity onPress={() => Alert.alert("Edit", "Edit feature coming soon")}>
                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className="flex-1 px-4 py-4"
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            {/* Project Header Card */}
            <View className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 mb-6">
              <View className="flex-row items-start justify-between mb-4">
                <View className="flex-1">
                  <Text className="text-3xl font-bold text-white">{project.title}</Text>
                  {project.description && (
                    <Text className="text-blue-100 text-sm mt-2">{project.description}</Text>
                  )}
                </View>
                <View className="bg-blue-500 rounded-full p-3">
                  <Ionicons name="folder" size={24} color="#fff" />
                </View>
              </View>

              <View className="flex-row items-center mt-4 pt-4 border-t border-blue-500">
                <Ionicons name="calendar-outline" size={16} color="#E0E7FF" />
                <Text className="text-blue-100 text-xs ml-2">
                  Created on {formatDate(project.createdAt)}
                </Text>
              </View>
            </View>

            {/* Project Stats */}
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="people-outline" size={18} color="#60A5FA" />
                  <Text className="text-gray-400 text-xs ml-2">Members</Text>
                </View>
                <Text className="text-2xl font-bold text-white">
                  {project.members?.length || 0}
                </Text>
              </View>

              <View className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="checkmark-done-outline" size={18} color="#10B981" />
                  <Text className="text-gray-400 text-xs ml-2">Tasks</Text>
                </View>
                <Text className="text-2xl font-bold text-white">
                  {project.tasks?.length || 0}
                </Text>
              </View>
            </View>

            {/* Members Section */}
            {project.members && project.members.length > 0 && (
              <View className="mb-6">
                <Text className="text-white font-bold text-lg mb-3">Team Members</Text>
                <View className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  {project.members.map((member: any, index: number) => (
                    <View
                      key={member.id || index}
                      className={`flex-row items-center p-4 ${
                        index !== project.members!.length - 1 ? "border-b border-gray-700" : ""
                      }`}
                    >
                      <View className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-full w-10 h-10 items-center justify-center">
                        <Text className="text-white font-bold">
                          {(member.name?.[0] || "?").toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-medium">{member.name}</Text>
                        <Text className="text-gray-400 text-xs">{member.email}</Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Tasks Section */}
            {project.tasks && project.tasks.length > 0 ? (
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white font-bold text-lg">Tasks</Text>
                  <TouchableOpacity>
                    <Text className="text-blue-400 text-sm">View all →</Text>
                  </TouchableOpacity>
                </View>
                <View className="space-y-2">
                  {project.tasks.slice(0, 5).map((task: any, index: number) => (
                    <View
                      key={task.id || index}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex-row items-start"
                    >
                      <Ionicons
                        name={
                          task.status?.name?.toLowerCase().includes("complete")
                            ? "checkmark-circle"
                            : "ellipse-outline"
                        }
                        size={20}
                        color={
                          task.status?.name?.toLowerCase().includes("complete")
                            ? "#10B981"
                            : "#9CA3AF"
                        }
                      />
                      <View className="flex-1 ml-3">
                        <Text className="text-white font-medium">{task.title}</Text>
                        {task.priority && (
                          <Text className="text-gray-400 text-xs mt-1">
                            {task.priority.name} Priority
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 items-center">
                <Ionicons name="checkmark-done-outline" size={48} color="#6B7280" />
                <Text className="text-gray-400 text-center mt-3">No tasks yet</Text>
                <Text className="text-gray-500 text-xs text-center mt-1">
                  Tasks will appear here once created
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View className="absolute bottom-20 left-0 right-0 px-4 flex-row gap-3">
            <TouchableOpacity 
              onPress={() => setModalVisible(true)}
              className="flex-1 bg-blue-600 rounded-xl py-4 items-center"
            >
              <Ionicons name="add-outline" size={20} color="#fff" />
              <Text className="text-white font-semibold text-sm mt-1">Add Task</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 bg-gray-800 border border-gray-700 rounded-xl py-4 items-center">
              <Ionicons name="people-outline" size={20} color="#60A5FA" />
              <Text className="text-blue-400 font-semibold text-sm mt-1">Invite</Text>
            </TouchableOpacity>
          </View>
        {/* Create Task Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={resetModal}
        >
          <View className="flex-1 justify-end bg-black/50">
            <LinearGradient
              colors={["#1F2937", "#111827"]}
              className="rounded-t-2xl p-6 max-h-[80%]"
            >
              {/* Modal Header */}
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="add-circle" size={24} color="#60A5FA" />
                  <Text className="text-2xl font-bold text-white">New Task</Text>
                </View>
                <TouchableOpacity onPress={resetModal}>
                  <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Task Title */}
                <View className="mb-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Ionicons name="document-text-outline" size={16} color="#60A5FA" />
                    <Text className="text-gray-300 font-medium">Title *</Text>
                  </View>
                  <TextInput
                    className="bg-gray-800 rounded-lg px-4 py-3 text-gray-200 border border-gray-700"
                    placeholder="Enter task title"
                    placeholderTextColor="#6B7280"
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                    editable={!savingTask}
                  />
                </View>

                {/* Task Description */}
                <View className="mb-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Ionicons name="chatbox-outline" size={16} color="#60A5FA" />
                    <Text className="text-gray-300 font-medium">Description</Text>
                  </View>
                  <TextInput
                    className="bg-gray-800 rounded-lg px-4 py-3 text-gray-200 border border-gray-700 min-h-[80px]"
                    placeholder="Add optional description..."
                    placeholderTextColor="#6B7280"
                    value={taskDescription}
                    onChangeText={setTaskDescription}
                    multiline
                    textAlignVertical="top"
                    editable={!savingTask}
                  />
                </View>

                {/* Status Selector */}
                <View className="mb-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Ionicons name="flag-outline" size={16} color="#60A5FA" />
                    <Text className="text-gray-300 font-medium">Status *</Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2 mb-2">
                    {statuses.map((status) => (
                      <TouchableOpacity
                        key={status.id}
                        onPress={() => setSelectedStatus(status.id)}
                        className={`px-4 py-2 rounded-lg border-2 ${
                          selectedStatus === status.id
                            ? "bg-blue-600 border-blue-400"
                            : "bg-gray-800 border-gray-700"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            selectedStatus === status.id
                              ? "text-white"
                              : "text-gray-300"
                          }`}
                        >
                          {status.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {/* Add New Status Button */}
                    <TouchableOpacity 
                      onPress={() => setStatusModalVisible(true)} 
                      className="px-4 py-2 rounded-lg border-2 border-dashed border-gray-600 items-center"
                    >
                      <Ionicons name="add-outline" size={16} color="#60A5FA" />
                      <Text className="text-sm text-gray-400 ml-1">Add New</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Priority Selector */}
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Ionicons name="alert-circle-outline" size={16} color="#60A5FA" />
                    <Text className="text-gray-300 font-medium">Priority *</Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2 mb-2">
                    {priorities.map((priority) => (
                      <TouchableOpacity
                        key={priority.id}
                        onPress={() => setSelectedPriority(priority.id)}
                        className={`px-4 py-2 rounded-lg border-2 ${
                          selectedPriority === priority.id
                            ? "bg-blue-600 border-blue-400"
                            : "bg-gray-800 border-gray-700"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            selectedPriority === priority.id
                              ? "text-white"
                              : "text-gray-300"
                          }`}
                        >
                          {priority.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {/* Add New Priority Button */}
                    <TouchableOpacity 
                      onPress={() => setPriorityModalVisible(true)} 
                      className="px-4 py-2 rounded-lg border-2 border-dashed border-gray-600 items-center"
                    >
                      <Ionicons name="add-outline" size={16} color="#60A5FA" />
                      <Text className="text-sm text-gray-400 ml-1">Add New</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3 mb-4">
                  <TouchableOpacity
                    onPress={handleCreateTask}
                    disabled={savingTask}
                    className="flex-1 bg-blue-600 rounded-lg py-3 items-center flex-row justify-center gap-2"
                  >
                    {savingTask ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color="#fff" />
                        <Text className="text-white font-semibold">Create</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={resetModal}
                    disabled={savingTask}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg py-3 items-center"
                  >
                    <Text className="text-gray-300 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </LinearGradient>
          </View>
        </Modal>

        {/* Mini-Modal for Adding Status */}
        <Modal
          visible={statusModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-gray-800 rounded-t-2xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-white">New Status</Text>
                <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <TextInput
                className="bg-gray-700 rounded-lg px-4 py-3 text-white mb-4"
                placeholder="Enter status name (e.g., Blocked)"
                placeholderTextColor="#6B7280"
                value={newStatusName}
                onChangeText={setNewStatusName}
              />
              <TouchableOpacity
                onPress={handleCreateStatus}
                className="bg-blue-600 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-semibold">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Mini-Modal for Adding Priority */}
        <Modal
          visible={priorityModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPriorityModalVisible(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-gray-800 rounded-t-2xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-white">New Priority</Text>
                <TouchableOpacity onPress={() => setPriorityModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <TextInput
                className="bg-gray-700 rounded-lg px-4 py-3 text-white mb-4"
                placeholder="Enter priority name (e.g., Critical)"
                placeholderTextColor="#6B7280"
                value={newPriorityName}
                onChangeText={setNewPriorityName}
              />
              <TouchableOpacity
                onPress={handleCreatePriority}
                className="bg-blue-600 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-semibold">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </LinearGradient>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
const Card = ({ children, ...props }: any) => (
  <View className="bg-blue-600 rounded-2xl p-6" {...props}>
    {children}
  </View>
);