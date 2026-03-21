import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Task, getTaskById, updateTask } from "@/src/services/taskService";
import { Comment, createComment, getCommentsByTask } from "@/src/services/commentService";
import { Status } from "@/src/services/statusService";
import { Priority } from "@/src/services/priorityService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAlert from "@/src/hooks/useAlert";
import { resolveFileUrl } from "@/src/utils/url";

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

export default function TaskDetailModal({ visible, taskId, onClose, projectMembers = [], statuses = [], priorities = [] }: Props) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'status'>('details');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  // Use custom alert hook
  const { showError, AlertComponent } = useAlert();

  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset = Platform.OS === "ios" ? insets.bottom + 16 : (StatusBar.currentHeight ?? 0) + 16;

  useEffect(() => {

    if (visible && taskId) {
      loadTaskData();
    } else if (!visible) {
      setTask(null);
      setComments([]);
      setActiveTab('details');
      setLoading(true);
      setError(null);
    }
  }, [visible, taskId]);

  const loadTaskData = async () => {
    if (!taskId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const taskData = await getTaskById(taskId);
      setTask(taskData);

      const commentsData = await getCommentsByTask(taskId);
      setComments(commentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (statusId: string) => {
    if (!task) return;
    try {
      setUpdatingStatus(true);
      await updateTask(task.id, { statusId });
      const newStatus = statuses.find(s => s.id === statusId);
      if (newStatus) {
        setTask({ ...task, statusId, status: newStatus as any });
      }
      setShowStatusDropdown(false);
    } catch (err) {
      showError("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePriority = async (priorityId: string) => {
    if (!task) return;
    try {
      setUpdatingPriority(true);
      await updateTask(task.id, { priorityId });
      const newPriority = priorities.find(p => p.id === priorityId);
      if (newPriority) {
        setTask({ ...task, priorityId, priority: newPriority as any });
      }
      setShowPriorityDropdown(false);
    } catch (err) {
      showError("Failed to update priority");
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !taskId) return;

    try {
      setPostingComment(true);
      await createComment({
        taskId,
        content: newComment.trim(),
      });
      setNewComment('');
      const commentsData = await getCommentsByTask(taskId);
      setComments(commentsData);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleUpdateAssignee = async (memberId: string | undefined) => {
    if (!task) return;
    try {
      // Optimistic update
      const updatedTask = { ...task, assigneeId: memberId };
       // We can't fully construct the assignee object here without lookup, 
       // but we'll accept the prop update. Ideally we'd look it up from projectMembers.
       const member = projectMembers.find(m => m.id === memberId);
       if (member) {
         updatedTask.assignee = member;
       } else {
         updatedTask.assignee = undefined;
       }
       setTask(updatedTask);
       setShowAssigneePicker(false);

      await updateTask(task.id, { assigneeId: memberId });
      
      // Reload to ensure consistency
      loadTaskData();
    } catch (err) {
      showError("Failed to update assignee");
      loadTaskData(); // Revert on error
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Don't render if not visible
  if (!visible) return null;

  const isDone = Boolean(task?.isCompleted);

  return (
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
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50">
              <View className="flex-1 mr-4">
                <Text className="text-xl font-bold text-white" numberOfLines={1}>
                  {loading ? "Loading..." : task?.title || "Task Detail"}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Ionicons name="close-circle" size={30} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <View className="flex-row border-b border-gray-700 bg-gray-900/30">
              <TouchableOpacity
                onPress={() => setActiveTab('details')}
                className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'details' ? 'border-blue-500' : 'border-transparent'}`}
              >
                <Text className={`font-medium ${activeTab === 'details' ? 'text-white' : 'text-gray-400'}`}>
                  Details
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('comments')}
                className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'comments' ? 'border-blue-500' : 'border-transparent'}`}
              >
                <Text className={`font-medium ${activeTab === 'comments' ? 'text-white' : 'text-gray-400'}`}>
                  Comments {comments.length > 0 && `(${comments.length})`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('status')}
                className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'status' ? 'border-blue-500' : 'border-transparent'}`}
              >
                <Text className={`font-medium ${activeTab === 'status' ? 'text-white' : 'text-gray-400'}`}>
                  Status
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#60A5FA" />
                <Text className="text-gray-400 mt-2">Loading task...</Text>
              </View>
            ) : error ? (
              <View className="flex-1 justify-center items-center p-6">
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-red-400 text-center mt-4">{error}</Text>
                <TouchableOpacity onPress={loadTaskData} className="mt-4 bg-gray-700 px-4 py-2 rounded-lg">
                  <Text className="text-white">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : task ? (
              <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* ... rest of the content stays the same ... */}
                {activeTab === 'details' && (
                  <View className="space-y-4">
                    <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <View className="flex-row items-start">
                        <Ionicons
                          name={isDone ? "checkmark-circle" : "ellipse-outline"}
                          size={24}
                          color={isDone ? "#10B981" : "#9CA3AF"}
                          style={{ marginTop: 2 }}
                        />
                        <Text className="text-white text-lg font-semibold ml-3 flex-1">
                          {task.title}
                        </Text>
                      </View>
                      {((task as any).description) ? (
                        <Text className="text-gray-300 mt-3 ml-9 leading-relaxed">
                          {(task as any).description}
                        </Text>
                      ) : (
                        <Text className="text-gray-500 mt-3 ml-9 italic">
                          No description provided
                        </Text>
                      )}
                    </View>

                    {task.dueDate && (
                      <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex-row items-center">
                        <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                        <View className="ml-3">
                          <Text className="text-gray-400 text-xs">Due Date</Text>
                          <Text className="text-white font-medium">{formatDate(task.dueDate)}</Text>
                        </View>
                      </View>
                    )}

                    {/* Assignee Section */}
                    <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center gap-2">
                          <Ionicons name="person-outline" size={20} color="#60A5FA" />
                          <Text className="text-gray-300 font-medium">Assignee</Text>
                        </View>
                        {projectMembers.length > 0 && (
                          <TouchableOpacity 
                            onPress={() => setShowAssigneePicker(!showAssigneePicker)}
                            className="bg-gray-700 px-3 py-1 rounded-lg"
                          >
                            <Text className="text-blue-400 text-xs font-semibold">
                              {showAssigneePicker ? "Cancel" : "Change"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {showAssigneePicker ? (
                        <View className="flex-row flex-wrap gap-2 mt-2">
                           <TouchableOpacity
                            onPress={() => handleUpdateAssignee(undefined)}
                            className={`px-3 py-2 rounded-lg border-2 items-center min-w-[70px] ${
                              !task.assigneeId ? "bg-blue-600 border-blue-400" : "bg-gray-800 border-gray-700"
                            }`}
                          >
                            <Ionicons name="person-remove-outline" size={20} color={!task.assigneeId ? "#fff" : "#9CA3AF"} />
                            <Text className={`text-xs mt-1 ${!task.assigneeId ? "text-white" : "text-gray-400"}`}>None</Text>
                          </TouchableOpacity>
                          
                          {projectMembers.map((member) => (
                            <TouchableOpacity
                              key={member.id}
                              onPress={() => handleUpdateAssignee(member.id)}
                              className={`px-3 py-2 rounded-lg border-2 items-center min-w-[70px] ${
                                task.assigneeId === member.id ? "bg-blue-600 border-blue-400" : "bg-gray-800 border-gray-700"
                              }`}
                            >
                               {member.profileImage ? (
                                <Image
                                  source={{ uri: resolveFileUrl(member.profileImage) }}
                                  className="w-8 h-8 rounded-full mb-1"
                                />
                              ) : (
                                <View className="w-8 h-8 rounded-full bg-gray-700 items-center justify-center mb-1">
                                  <Text className="text-white text-xs font-semibold">
                                    {member.name?.charAt(0)?.toUpperCase() || "?"}
                                  </Text>
                                </View>
                              )}
                              <Text className={`text-xs text-center ${task.assigneeId === member.id ? "text-white" : "text-gray-400"}`} numberOfLines={1}>
                                {member.name.split(' ')[0]}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        <View className="flex-row items-center">
                          {task.assignee ? (
                            <>
                              {task.assignee.profileImage ? (
                                <Image
                                  source={{ uri: resolveFileUrl(task.assignee.profileImage) }}
                                  className="w-10 h-10 rounded-full border-2 border-gray-700"
                                />
                              ) : (
                                <View className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center border-2 border-gray-700">
                                  <Text className="text-white text-sm font-bold">
                                    {task.assignee.name?.charAt(0)?.toUpperCase() || "?"}
                                  </Text>
                                </View>
                              )}
                              <View className="ml-3">
                                <Text className="text-white font-medium">{task.assignee.name}</Text>
                                <Text className="text-gray-500 text-xs">{task.assignee.email}</Text>
                              </View>
                            </>
                          ) : (
                            <View className="flex-row items-center">
                              <View className="w-10 h-10 rounded-full bg-gray-700/50 items-center justify-center border-2 border-dashed border-gray-600">
                                <Ionicons name="person-outline" size={20} color="#6B7280" />
                              </View>
                              <View className="ml-3">
                                <Text className="text-gray-400 italic">Unassigned</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {activeTab === 'comments' && (
                  <View className="space-y-4">
                    <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 mb-2">
                      <TextInput
                        className="bg-gray-900 rounded-lg px-4 py-3 text-white min-h-[60px] border border-gray-700"
                        placeholder="Type a comment..."
                        placeholderTextColor="#6B7280"
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                        textAlignVertical="top"
                      />
                      <TouchableOpacity
                        onPress={handlePostComment}
                        disabled={!newComment.trim() || postingComment}
                        className={`mt-3 self-end px-4 py-2 rounded-lg ${newComment.trim() && !postingComment ? 'bg-blue-600' : 'bg-gray-700'}`}
                      >
                        {postingComment ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text className="text-white font-medium text-sm">Post</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {comments.length === 0 ? (
                      <View className="items-center py-8">
                        <Ionicons name="chatbubble-outline" size={32} color="#4B5563" />
                        <Text className="text-gray-500 text-sm mt-2">No comments yet</Text>
                      </View>
                    ) : (
                      comments.map((comment) => (
                        <View key={comment.id} className="bg-gray-800/30 rounded-xl p-4 mb-2 border border-gray-700/50">
                          <View className="flex-row items-center mb-2">
                            <View className="w-6 h-6 rounded-full bg-blue-900/50 items-center justify-center border border-blue-500/30">
                              <Text className="text-blue-400 text-xs font-bold">
                                {comment.author.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text className="text-gray-300 text-sm font-medium ml-2">
                              {comment.author.name}
                            </Text>
                            <Text className="text-gray-500 text-xs ml-auto">
                              {formatDate(comment.createdAt)}
                            </Text>
                          </View>
                          <Text className="text-gray-300 text-sm pl-8">
                            {comment.content}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {activeTab === 'status' && (
                  <View className="space-y-3">
                    {/* Status */}
                    <View>
                      <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          <View className="w-8 h-8 rounded-full bg-yellow-900/30 items-center justify-center">
                            <Ionicons name="flag" size={16} color="#FBBF24" />
                          </View>
                          <Text className="text-gray-300 font-medium">Status</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          {updatingStatus && <ActivityIndicator size="small" color="#60A5FA" />}
                          <TouchableOpacity onPress={() => setShowStatusDropdown(!showStatusDropdown)} disabled={updatingStatus} className="px-3 py-1 rounded-full bg-yellow-900/30 border border-yellow-700/50 flex-row items-center gap-1">
                            <Text className="text-yellow-500 text-sm font-medium">{task.status?.name || "-"}</Text>
                            <Ionicons name={showStatusDropdown ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {showStatusDropdown && statuses.length > 0 && (
                        <View className="items-end pr-4">
                          <View className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden w-40">
                            {statuses.map((status) => (
                              <TouchableOpacity key={status.id} onPress={() => handleUpdateStatus(status.id)} disabled={updatingStatus} className={`px-4 py-3 flex-row items-center justify-between border-b border-gray-700 ${task.statusId === status.id ? "bg-gray-700" : ""}`}>
                                <Text className={`text-sm ${task.statusId === status.id ? "text-white font-medium" : "text-gray-300"}`}>{status.name}</Text>
                                {task.statusId === status.id && <Ionicons name="checkmark" size={16} color="#60A5FA" />}
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Priority */}
                    <View>
                      <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          <View className="w-8 h-8 rounded-full bg-red-900/30 items-center justify-center">
                            <Ionicons name="alert-circle" size={18} color="#EF4444" />
                          </View>
                          <Text className="text-gray-300 font-medium">Priority</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          {updatingPriority && <ActivityIndicator size="small" color="#60A5FA" />}
                          <TouchableOpacity onPress={() => setShowPriorityDropdown(!showPriorityDropdown)} disabled={updatingPriority} className="px-3 py-1 rounded-full bg-red-900/30 border border-red-700/50 flex-row items-center gap-1">
                            <Text className="text-red-400 text-sm font-medium">{task.priority?.name || "-"}</Text>
                            <Ionicons name={showPriorityDropdown ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {showPriorityDropdown && priorities.length > 0 && (
                        <View className="items-end pr-4">
                          <View className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden w-40">
                            {priorities.map((priority) => (
                              <TouchableOpacity key={priority.id} onPress={() => handleUpdatePriority(priority.id)} disabled={updatingPriority} className={`px-4 py-3 flex-row items-center justify-between border-b border-gray-700 ${task.priorityId === priority.id ? "bg-gray-700" : ""}`}>
                                <Text className={`text-sm ${task.priorityId === priority.id ? "text-white font-medium" : "text-gray-300"}`}>{priority.name}</Text>
                                {task.priorityId === priority.id && <Ionicons name="checkmark" size={16} color="#60A5FA" />}
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>

                    <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className="w-8 h-8 rounded-full bg-gray-700/50 items-center justify-center">
                          <Ionicons name="time" size={18} color="#9CA3AF" />
                        </View>
                        <Text className="text-gray-300 font-medium">Created</Text>
                      </View>
                      <Text className="text-gray-400 text-sm">
                        {formatDate(task.createdAt)}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            ) : (
              // Task is null after loading - show error state
              <View className="flex-1 justify-center items-center p-6">
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-red-400 text-center mt-4">Task not found</Text>
                <TouchableOpacity onPress={onClose} className="mt-4 bg-gray-700 px-4 py-2 rounded-lg">
                  <Text className="text-white">Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </Modal>
    );

  {/* Custom Alert */}
  {AlertComponent}
}