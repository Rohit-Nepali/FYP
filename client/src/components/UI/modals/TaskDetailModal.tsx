import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  Task,
  getTaskById,
  updateTask,
  deleteTaskAttachment,
  uploadAttachments,
} from "@/src/services/taskService";
import {
  Comment,
  createComment,
  getCommentsByTask,
} from "@/src/services/commentService";
import { Attachment } from "@/src/services/attachmentService";
import { getTaskPermissions } from "@/src/utils/permissions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAlert from "@/src/hooks/useAlert";
import useToast from "@/src/hooks/useToast";
import AttachmentPreviewModal from "./AttachmentPreviewModal";
import {
  TaskAttachmentsTab,
  TaskCommentsTab,
  TaskDetailHeader,
  TaskDetailTabBar,
  TaskDetailsTab,
  TaskDetailTabKey,
  TaskStatusTab,
} from "./taskDetail/TaskDetailModalSections";

interface Props {
  visible: boolean;
  taskId: string | null;
  onClose: () => void;
  projectMembers?: Array<{
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  }>;
  statuses?: Array<{ id: string; name: string }>;
  priorities?: Array<{ id: string; name: string }>;
}

export default function TaskDetailModal({
  visible,
  taskId,
  onClose,
  projectMembers = [],
  statuses = [],
  priorities = [],
}: Props) {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TaskDetailTabKey>("details");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [updatingCompletion, setUpdatingCompletion] = useState(false);
  const [selectedAttachment, setSelectedAttachment] =
    useState<Attachment | null>(null);
  const [deletingAttachment, setDeletingAttachment] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const { showError, AlertComponent } = useAlert();
  const { success: showSuccessToast, error: showErrorToast, ToastComponent } = useToast();

  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset =
    Platform.OS === "ios"
      ? insets.bottom + 16
      : (StatusBar.currentHeight ?? 0) + 16;

  // Compute permissions with optional project context when available from API.
  const permissions =
    task && user
      ? getTaskPermissions(
          {
            creatorId: task.creatorId,
            assigneeId: task.assigneeId,
            projectId: task.projectId,
            project: task.projectId
              ? {
                  ownerId: (task as any).project?.ownerId ?? "",
                  members: projectMembers.map((member) => ({ userId: member.id })),
                }
              : null,
          },
          user.id
        )
      : null;
  
  const canViewTask = permissions?.canView ?? false;
  const canEdit = permissions?.canEditTitle ?? false;
  const canDelete = permissions?.canDelete ?? false;
  const canManageAssignees = permissions?.canAssign ?? false;
  const canManageStatus = permissions?.canEditStatus ?? false;
  const canMarkComplete = permissions?.canMarkComplete ?? false;
  const canComment = permissions?.canComment ?? false;
  const canViewAttachments = permissions?.canView ?? false;
  const canUploadAttachments = permissions?.canUploadAttachment ?? false;
  const canDeleteAttachments = permissions?.canDeleteAnyAttachment ?? false;

  useEffect(() => {
    if (visible && taskId) {
      loadTaskData();
    } else if (!visible) {
      setTask(null);
      setComments([]);
      setActiveTab("details");
      setLoading(true);
      setError(null);
      setSelectedAttachment(null);
      setDeletingAttachment(false);
      setUploadingAttachment(false);
      setShowAssigneePicker(false);
    }
  }, [visible, taskId]);

  const loadTaskData = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      setError(null);

      const taskData = await getTaskById(taskId);
      setTask(taskData);

      const commentsData = await getCommentsByTask(taskId);
      setComments(commentsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load task details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (statusId: string) => {
    if (!task || !canManageStatus) {
      showError("You don't have permission to update task status");
      return;
    }

    try {
      setUpdatingStatus(true);
      await updateTask(task.id, { statusId });
      const newStatus = statuses.find((status) => status.id === statusId);
      if (newStatus) {
        setTask({ ...task, statusId, status: newStatus as any });
        showSuccessToast(`Status updated to ${newStatus.name}`);
      }
    } catch {
      showErrorToast("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePriority = async (priorityId: string) => {
    if (!task || !canEdit) {
      showError("You don't have permission to update task priority");
      return;
    }

    try {
      setUpdatingPriority(true);
      await updateTask(task.id, { priorityId });
      const newPriority = priorities.find(
        (priority) => priority.id === priorityId
      );
      if (newPriority) {
        setTask({ ...task, priorityId, priority: newPriority as any });
        showSuccessToast(`Priority set to ${newPriority.name}`);
      }
    } catch {
      showErrorToast("Failed to update priority");
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleToggleCompletion = async () => {
    if (!task) return;

    if (!canMarkComplete) {
      showError("You don't have permission to update completion status");
      return;
    }

    try {
      setUpdatingCompletion(true);
      const nextCompleted = !Boolean(task.isCompleted);
      await updateTask(task.id, { isCompleted: nextCompleted });
      setTask({ ...task, isCompleted: nextCompleted });
      showSuccessToast(nextCompleted ? "Task marked as complete" : "Task marked as incomplete");
    } catch {
      showErrorToast("Failed to update completion status");
    } finally {
      setUpdatingCompletion(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !taskId) return;

    if (!canComment) {
      showError("You don't have permission to comment on this task");
      return;
    }

    try {
      setPostingComment(true);
      await createComment({
        taskId,
        content: newComment.trim(),
      });
      setNewComment("");
      const commentsData = await getCommentsByTask(taskId);
      setComments(commentsData);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to post comment"
      );
    } finally {
      setPostingComment(false);
    }
  };

  const handleUpdateAssignee = async (memberId: string | undefined) => {
    if (!task || !canManageAssignees) {
      showError("You don't have permission to assign tasks");
      return;
    }

    try {
      const updatedTask = { ...task, assigneeId: memberId };
      const member = projectMembers.find(
        (projectMember) => projectMember.id === memberId
      );

      if (member) {
        updatedTask.assignee = member;
      } else {
        updatedTask.assignee = undefined;
      }

      setTask(updatedTask);
      setShowAssigneePicker(false);

      await updateTask(task.id, { assigneeId: memberId });
      
      // Show appropriate toast message
      if (!memberId) {
        showSuccessToast("Task unassigned");
      } else if (memberId === user?.id) {
        showSuccessToast(`Assigned yourself to ${task.title}`);
      } else if (member) {
        showSuccessToast(`Assigned ${member.name} to ${task.title}`);
      }
      
      loadTaskData();
    } catch {
      showErrorToast("Failed to update assignee");
      loadTaskData();
    }
  };

  const handleDeleteAttachment = async () => {
    if (!task || !selectedAttachment) return;

    if (!canDeleteAttachments) {
      showError("You don't have permission to delete attachments");
      return;
    }

    try {
      setDeletingAttachment(true);
      await deleteTaskAttachment(task.id, selectedAttachment.id);
      setSelectedAttachment(null);
      await loadTaskData();
    } catch {
      showError("Failed to delete attachment");
    } finally {
      setDeletingAttachment(false);
    }
  };

  const handleUploadAttachment = async () => {
    if (!task) return;

    if (!canUploadAttachments) {
      showError("You don't have permission to upload attachments");
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      setUploadingAttachment(true);

      const files = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || "application/octet-stream",
      }));

      await uploadAttachments(task.id, files);
      await loadTaskData();
    } catch {
      showError("Failed to upload attachment");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!visible) return null;

  const isDone = Boolean(task?.isCompleted);
  const attachments = (task?.attachments || []) as Attachment[];

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View className="flex-1 justify-end bg-black/50">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={keyboardVerticalOffset}
            className="h-[85%]"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <LinearGradient
                colors={["#1F2937", "#111827"]}
                className="flex-1 rounded-t-2xl overflow-hidden"
              >
                <TaskDetailHeader
                  title={task?.title}
                  loading={loading}
                  onClose={onClose}
                  canDelete={canDelete}
                />

                <TaskDetailTabBar
                  activeTab={activeTab}
                  onChangeTab={setActiveTab}
                  commentsCount={comments.length}
                  attachmentsCount={attachments.length}
                />

                {loading ? (
                  <View className="flex-1 justify-center items-center px-6">
                    <View className="w-16 h-16 rounded-full bg-blue-600/20 items-center justify-center mb-4">
                      <ActivityIndicator size="large" color="#60A5FA" />
                    </View>
                    <Text className="text-white font-semibold text-base">
                      Loading task details...
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">Please wait</Text>
                  </View>
                ) : error ? (
                  <View className="flex-1 justify-center items-center px-6">
                    <View className="w-16 h-16 rounded-full bg-red-600/20 items-center justify-center mb-4">
                      <Ionicons
                        name="alert-circle-outline"
                        size={40}
                        color="#EF4444"
                      />
                    </View>
                    <Text className="text-white text-lg font-semibold text-center">
                      Failed to load task
                    </Text>
                    <Text className="text-gray-400 text-sm mt-2 text-center">
                      {error}
                    </Text>
                    <TouchableOpacity
                      onPress={loadTaskData}
                      className="mt-6 bg-blue-600 px-6 py-3 rounded-xl flex-row items-center gap-2"
                    >
                      <Ionicons name="refresh" size={18} color="#fff" />
                      <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : task && canViewTask ? (
                  <ScrollView
                    className="flex-1 p-4"
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {activeTab === "details" && (
                      <TaskDetailsTab
                        task={task}
                        isDone={isDone}
                        formatDate={formatDate}
                        updatingCompletion={updatingCompletion}
                        onToggleCompletion={handleToggleCompletion}
                        canMarkComplete={canMarkComplete}
                        projectMembers={projectMembers}
                        showAssigneePicker={showAssigneePicker}
                        onToggleAssigneePicker={() =>
                          setShowAssigneePicker(!showAssigneePicker)
                        }
                        onUpdateAssignee={handleUpdateAssignee}
                        canManageAssignees={canManageAssignees}
                      />
                    )}

                    {activeTab === "comments" && (
                      <TaskCommentsTab
                        newComment={newComment}
                        onChangeComment={setNewComment}
                        postingComment={postingComment}
                        onPostComment={handlePostComment}
                        comments={comments}
                        formatDate={formatDate}
                        canComment={canComment}
                      />
                    )}

                    {activeTab === "status" && (
                      <TaskStatusTab
                        task={task}
                        statuses={statuses}
                        priorities={priorities}
                        updatingStatus={updatingStatus}
                        updatingPriority={updatingPriority}
                        onUpdateStatus={handleUpdateStatus}
                        onUpdatePriority={handleUpdatePriority}
                        formatDate={formatDate}
                        canManageStatus={canManageStatus}
                        canEdit={canEdit}
                      />
                    )}

                    {activeTab === "attachments" && (
                      <TaskAttachmentsTab
                        attachments={attachments}
                        uploadingAttachment={uploadingAttachment}
                        onUploadAttachment={handleUploadAttachment}
                        onSelectAttachment={setSelectedAttachment}
                        formatDate={formatDate}
                        canUploadAttachments={canUploadAttachments}
                        canViewAttachments={canViewAttachments}
                      />
                    )}
                  </ScrollView>
                ) : task && !canViewTask ? (
                  <View className="flex-1 justify-center items-center p-6">
                    <View className="w-16 h-16 rounded-full bg-yellow-600/20 items-center justify-center mb-4">
                      <Ionicons name="lock-closed-outline" size={36} color="#F59E0B" />
                    </View>
                    <Text className="text-white text-lg font-semibold text-center">
                      Access restricted
                    </Text>
                    <Text className="text-gray-400 text-sm mt-2 text-center">
                      You do not have permission to view this task.
                    </Text>
                    <TouchableOpacity
                      onPress={onClose}
                      className="mt-6 bg-gray-700 px-6 py-3 rounded-xl"
                    >
                      <Text className="text-white font-semibold">Close</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="flex-1 justify-center items-center p-6">
                    <View className="w-16 h-16 rounded-full bg-red-600/20 items-center justify-center mb-4">
                      <Ionicons
                        name="alert-circle-outline"
                        size={40}
                        color="#EF4444"
                      />
                    </View>
                    <Text className="text-white text-lg font-semibold">
                      Task not found
                    </Text>
                    <TouchableOpacity
                      onPress={onClose}
                      className="mt-6 bg-gray-700 px-6 py-3 rounded-xl"
                    >
                      <Text className="text-white font-semibold">Close</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </LinearGradient>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <AttachmentPreviewModal
        visible={!!selectedAttachment}
        attachment={selectedAttachment}
        onClose={() => setSelectedAttachment(null)}
        onDelete={canDeleteAttachments && !deletingAttachment ? handleDeleteAttachment : undefined}
      />

      {AlertComponent}
      {ToastComponent}
    </>
  );
}
