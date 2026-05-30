import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import TaskModal from "@/src/components/UI/modals/TaskModal";
import { useAuth } from "@/src/contexts/AuthContext";
import { getProjectById, Project } from "@/src/services/projectService";
import { getAllStatuses, Status } from "@/src/services/statusService";
import { getAllPriorities, Priority } from "@/src/services/priorityService";
import { createTask } from "@/src/services/taskService";
import useAlert from "@/src/hooks/useAlert";
import useToast from "@/src/hooks/useToast";
import TaskDetailModal from "./UI/modals/TaskDetailModal";
import { resolveFileUrl } from "@/src/utils/url";

interface ProjectDetail extends Project {
  tasks?: any[];
}

interface ProjectTasksListProps {
  projectId: string;
}

export default function ProjectTasksList({ projectId }: ProjectTasksListProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Create Task Modal State
  const [modalVisible, setModalVisible] = useState(false);

  // Task Detail Modal State into a singele state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [taskDetailModal, setTaskDetailModal] = useState<{ visible: boolean, taskId: string | null }>(
    { visible: false, taskId: null }
  );

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [savingTask, setSavingTask] = useState(false);

  // Use custom alert hook
  const { showError, showSuccess, AlertComponent } = useAlert();
  const { success: showSuccessToast, error: showErrorToast, ToastComponent } = useToast();

  useEffect(() => {
    if (projectId) {
      loadProjectDetail(projectId);
    }
    loadStatusesAndPriorities();
  }, [projectId]);

  const loadProjectDetail = async (id: string) => {
    try {
      setLoading(true);
      const data = await getProjectById(id);
      setProject(data);
    } catch (err) {
      console.error("Failed to load project", err);
      showError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const loadStatusesAndPriorities = async () => {
    try {
      const [statusesData, prioritiesData] = await Promise.all([
        getAllStatuses(projectId),
        getAllPriorities(projectId),
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

  // FIXED: Single atomic state update for opening
  const handleTaskClick = (taskId: string) => {
    console.log("Task clicked", taskId);
    setTaskDetailModal({ visible: true, taskId });
  };

  // FIXED: Single atomic state update for closing
  const handleCloseTaskDetail = () => {
    setTaskDetailModal({
      visible: false,
      taskId: null,
    });
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
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator size="large" color="#60A5FA" />
      </View>
    );
  }

  if (!project) {
    return (
      <View className="flex-1 justify-center items-center px-6 py-10">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-white text-base mt-4">Project not found</Text>
      </View>
    );
  }

  const taskCount = project.tasks?.length || 0;
  const isProjectOwner = project.ownerId === user?.id;

  // Extract project members for assignee selection
  const projectMembers = [
    // Include project owner
    ...(project.owner ? [{
      id: project.owner.id,
      name: project.owner.name,
      email: project.owner.email,
      profileImage: project.owner.profileImage,
    }] : []),
    // Include all members
    ...(project.members?.map((m: any) => ({
      id: m.user?.id || m.userId,
      name: m.user?.name || m.name,
      email: m.user?.email || m.email,
      profileImage: m.user?.profileImage || m.profileImage,
    })) || []),
  ].filter((member, index, self) => 
    // Remove duplicates by id
    index === self.findIndex((m) => m.id === member.id)
  );

  return (
    <View className="flex-1">
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
            {project.tasks!.map((task: any, index: number) => {
              const isDone = Boolean(task.isCompleted);

              return (
                <TouchableOpacity
                  key={task.id || index}
                  className="flex-row items-center bg-gray-900/60 rounded-xl px-3 py-3 mb-2"
                  onPress={() => task.id && handleTaskClick(task.id)}
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

                      {/* Assignee Avatar */}
                      {task.assignee && (
                        <View className="flex-row items-center mr-2">
                          {task.assignee.profileImage ? (
                            <Image
                              source={{ uri: resolveFileUrl(task.assignee.profileImage) }}
                              className="w-5 h-5 rounded-full mr-1"
                            />
                          ) : (
                            <View className="w-5 h-5 rounded-full bg-gray-700 items-center justify-center mr-1">
                              <Text className="text-white text-[8px] font-semibold">
                                {task.assignee.name?.charAt(0)?.toUpperCase() || "?"}
                              </Text>
                            </View>
                          )}
                          <Text className="text-gray-400 text-xs">
                            {task.assignee.name}
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

      {isProjectOwner ? (
        <View className="mt-4 mb-8">
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="bg-blue-600 rounded-xl py-3 flex-row items-center justify-center"
          >
            <Ionicons name="add-outline" size={18} color="#fff" />
            <Text className="text-white font-semibold text-sm ml-2">
              Add Task
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="mt-4 mb-8 rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-3">
          <Text className="text-center text-xs text-gray-500">
            You are a project member. Tasks are view-only, but you can leave comments for other members .
          </Text>
        </View>
      )}

      {/* Create Task Modal */}
      <TaskModal
        visible={modalVisible}
        onClose={resetModal}
        onSave={async (payload) => {
          setSavingTask(true);
          try {
            return await createTask({ ...payload, projectId });
          } finally {
            setSavingTask(false);
          }
        }}
        onCreated={() => {
          resetModal();
          loadProjectDetail(projectId);
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
        projectId={projectId}
        projectMembers={projectMembers}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        visible={taskDetailModal.visible}
        taskId={taskDetailModal.taskId}
        onClose={handleCloseTaskDetail}
        onDeleted={(taskId) => {
          // reload project after task deletion
          void loadProjectDetail(projectId);
        }}
        projectMembers={projectMembers}
        statuses={statuses.map(s => ({ id: s.id, name: s.name }))}
        priorities={priorities.map(p => ({ id: p.id, name: p.name }))}
      />

      {/* Custom Alert */}
      {AlertComponent}
      {ToastComponent}
    </View>
  );
}
