// app/tasks/[id].tsx
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Task, getTaskById } from "@/src/services/taskService";
import { Comment, createComment, getCommentsByTask } from "@/src/services/commentService";
import { Button } from "@/src/components/UI/Buttons";
import {
  syncTaskToCalendar,
  getCalendarConnectionStatus,
  CalendarConnectionStatus,
} from "@/src/services/calendarService";
import useAlert from "@/src/hooks/useAlert";

export default function TaskDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'status'>('details');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const { showError, AlertComponent } = useAlert();

  // Calendar sync state
  const [calendarStatus, setCalendarStatus] = useState<CalendarConnectionStatus>({ connected: false });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    const loadTask = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await getTaskById(taskId);
        setTask(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load task details"
        );
      } finally {
        setLoading(false);
      }
    };

    const loadComments = async () => {
      try {
        const commentsData = await getCommentsByTask(taskId);
        setComments(commentsData);
      } catch (err) {
        console.error("Failed to load comments", err);
      }
    };

    loadTask();
    loadComments();
  }, [taskId]);

  // Check calendar connection on mount
  useEffect(() => {
    const checkCalendar = async () => {
      try {
        const status = await getCalendarConnectionStatus();
        setCalendarStatus(status);
      } catch (err) {
        // Silently fail — calendar is an optional feature
      }
    };
    checkCalendar();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getCommentErrorMessage = (err: unknown) => {
    const message = err instanceof Error ? err.message : "";

    if (!message) {
      return "Could not add comment. Please try again later.";
    }

    const normalizedMessage = message.trim().toLowerCase();
    if (
      normalizedMessage === "internal server error" ||
      normalizedMessage.includes("internal server error")
    ) {
      return "Could not add comment. Please try again later.";
    }

    return message;
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    try {
      setPostingComment(true);
      await createComment({
        taskId,
        content: newComment.trim(),
      });
      setNewComment('');
      // Reload comments
      const commentsData = await getCommentsByTask(taskId);
      setComments(commentsData);
    } catch (err) {
      showError(getCommentErrorMessage(err), "Comment Error");
    } finally {
      setPostingComment(false);
    }
  };

  // Handle sync to Google Calendar
  const handleSyncToCalendar = async () => {
    if (!task) return;

    if (!calendarStatus.connected) {
      Alert.alert(
        "Connect Google Calendar",
        "You need to connect your Google Calendar first to sync tasks.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Connect",
            onPress: () => router.push("/settings/CalendarSettings"),
          },
        ]
      );
      return;
    }

    try {
      setIsSyncing(true);

      // Use due date as start, and 1 hour later as end
      const startDate = task.dueDate
        ? new Date(task.dueDate)
        : new Date();
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      await syncTaskToCalendar(task.id, {
        title: task.title,
        description: task.description || undefined,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      setIsSynced(true);
      Alert.alert("Synced!", "Task has been added to your Google Calendar.");
    } catch (err) {
      Alert.alert(
        "Sync Failed",
        err instanceof Error ? err.message : "Failed to sync to Google Calendar"
      );
    } finally {
      setIsSyncing(false);
    }
  };

  if (!taskId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-300 text-center">
            No task id provided.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isDone =
    task &&
    task.status &&
    (task.status.name.toLowerCase().includes("complete") ||
      task.status.name.toLowerCase().includes("done"));

  const description = (task as any)?.description as string | undefined;
  const projectTitle =
    (task as any)?.project?.title ||
    (task as any)?.project?.name ||
    undefined;
  const projectId =
    (task as any)?.project?.id || (task as any)?.projectId || undefined;

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {AlertComponent}
      {/* Header */}
      <View className="pt-6 pb-4 px-6 bg-gray-900/50">
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text
            className="text-xl font-bold text-white"
            numberOfLines={1}
          >
            Task
          </Text>

          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="mx-4 ">
        <View className="flex-row ">
          {/* Details Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab('details')}
            className="flex-1 py-3 items-center"
          >
            <Text
              className={`font-medium ${activeTab === 'details' ? 'text-white' : 'text-gray-400'
                }`}
            >
              Details
            </Text>

            {activeTab === 'details' && (
              <View className="mt-2 h-0.5 w-8 bg-white rounded-full" />
            )}
          </TouchableOpacity>

          {/* Comments Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab('comments')}
            className="flex-1 py-3 items-center"
          >
            <Text
              className={`font-medium ${activeTab === 'comments' ? 'text-white' : 'text-gray-400'
                }`}
            >
              Comments ({comments.length})
            </Text>

            {activeTab === 'comments' && (
              <View className="mt-2 h-0.5 w-10 bg-white rounded-full" />
            )}
          </TouchableOpacity>

          {/* Status Tab */}
          <TouchableOpacity
            onPress={() => setActiveTab('status')}
            className="flex-1 py-3 items-center"
          >
            <Text
              className={`font-medium ${activeTab === 'status' ? 'text-white' : 'text-gray-400'
                }`}
            >
              Status
            </Text>

            {activeTab === 'status' && (
              <View className="mt-2 h-0.5 w-8 bg-white rounded-full" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#8b5cf6" />
          </View>
        ) : error ? (
          <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <Text className="text-red-300 font-semibold mb-2">
              Unable to load task
            </Text>
            <Text className="text-gray-400 text-sm mb-3">{error}</Text>
            <Button
              title="Go back"
              onPress={() => router.back()}
              variant="danger"
              size="small"
            />
          </View>
        ) : !task ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color="#6B7280"
            />
            <Text className="text-gray-300 font-semibold mt-3">
              Task not found
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {activeTab === 'details' && (
              <>
                <View className="bg-gray-800/90 rounded-3xl p-5">
                  <View className="flex-row items-start">
                    <Ionicons
                      name={isDone ? "checkmark-circle" : "ellipse-outline"}
                      size={26}
                      color={isDone ? "#10B981" : "#9CA3AF"}
                      style={{ marginTop: 2 }}
                    />

                    <View className="flex-1 ml-4">
                      <Text className="text-white font-semibold text-xl leading-snug">
                        {task.title}
                      </Text>
                    </View>
                  </View>

                  {description && (
                    <Text className="text-gray-300 text-sm mt-4 leading-relaxed">
                      {description}
                    </Text>
                  )}
                </View>

                {/* Due date */}
                {task.dueDate && (
                  <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color="#9CA3AF"
                      />
                      <Text className="text-gray-300 font-medium ml-2">
                        Due date
                      </Text>
                    </View>
                    <Text className="text-gray-100 text-sm">
                      {formatDate(task.dueDate)}
                    </Text>
                  </View>
                )}

                {/* Sync to Google Calendar */}
                {task.dueDate && (
                  <TouchableOpacity
                    onPress={handleSyncToCalendar}
                    disabled={isSyncing || isSynced}
                    className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex-row items-center justify-between"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name="logo-google"
                        size={16}
                        color={isSynced ? "#10B981" : calendarStatus.connected ? "#3B82F6" : "#9CA3AF"}
                      />
                      <Text className={`font-medium ml-2 ${
                        isSynced ? "text-green-400" : calendarStatus.connected ? "text-blue-400" : "text-gray-400"
                      }`}>
                        {isSynced ? "Synced to Calendar" : "Sync to Calendar"}
                      </Text>
                    </View>

                    {isSyncing ? (
                      <ActivityIndicator size="small" color="#3B82F6" />
                    ) : isSynced ? (
                      <View className="flex-row items-center bg-green-500/20 px-2.5 py-1 rounded-full">
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text className="text-green-400 text-xs font-medium ml-1">Synced</Text>
                      </View>
                    ) : calendarStatus.connected ? (
                      <Ionicons name="sync-outline" size={18} color="#3B82F6" />
                    ) : (
                      <View className="flex-row items-center">
                        <Text className="text-gray-500 text-xs mr-1">Connect</Text>
                        <Ionicons name="chevron-forward" size={14} color="#6B7280" />
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {/* Project link (if available) */}
                {projectTitle && (
                  <TouchableOpacity
                    className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex-row items-center justify-between"
                    onPress={() =>
                      projectId && router.push(`/projects/${projectId}`)
                    }
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name="folder-outline"
                        size={18}
                        color="#60A5FA"
                      />
                      <Text className="text-gray-300 font-medium ml-2">
                        Project
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-blue-400 text-sm mr-1">
                        {projectTitle}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color="#9CA3AF"
                      />
                    </View>
                  </TouchableOpacity>
                )}
              </>
            )}

            {activeTab === 'comments' && (
              <View className="space-y-4">
                {/* Add Comment */}
                <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                  <Text className="text-white font-semibold mb-3">Add Comment</Text>
                  <TextInput
                    className="bg-gray-700 rounded-xl px-4 py-3 text-white min-h-[80px] mb-3"
                    placeholder="Write a comment..."
                    placeholderTextColor="#6B7280"
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    textAlignVertical="top"
                  />
                  <Button
                    title="Post Comment"
                    onPress={handlePostComment}
                    variant="primary"
                    disabled={!newComment.trim() || postingComment}
                    loading={postingComment}
                    className="w-full"
                  />
                </View>

                {/* Comments List */}
                {comments.length === 0 ? (
                  <View className="items-center py-8">
                    <Ionicons name="chatbubble-outline" size={40} color="#6B7280" />
                    <Text className="text-gray-400 text-sm mt-2">
                      No comments yet
                    </Text>
                  </View>
                ) : (
                  comments.map((comment) => (
                    <View key={comment.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                      <View className="flex-row items-start">
                        <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center mr-3">
                          <Text className="text-white font-semibold text-sm">
                            {comment.author.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center mb-2">
                            <Text className="text-white font-medium text-sm">
                              {comment.author.name}
                            </Text>
                            <Text className="text-gray-400 text-xs ml-2">
                              {formatDate(comment.createdAt)}
                            </Text>
                          </View>
                          <Text className="text-gray-300 text-sm">
                            {comment.content}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'status' && (
              <View className="space-y-4">
                {/* Status */}
                <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="flag-outline" size={18} color="#FBBF24" />
                    <Text className="text-gray-300 font-medium ml-2">
                      Status
                    </Text>
                  </View>
                  <Text className="text-gray-100 text-sm">
                    {task.status?.name ?? "-"}
                  </Text>
                </View>

                {/* Priority */}
                <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                    <Text className="text-gray-300 font-medium ml-2">
                      Priority
                    </Text>
                  </View>
                  <Text className="text-gray-100 text-sm">
                    {task.priority?.name ?? "-"}
                  </Text>
                </View>

                {/* Created */}
                <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                    <Text className="text-gray-300 font-medium ml-2">
                      Created
                    </Text>
                  </View>
                  <Text className="text-gray-100 text-sm">
                    {formatDate(task.createdAt)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}