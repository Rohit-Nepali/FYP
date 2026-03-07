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
import { Task, getTaskById } from "../../services/taskService";
import { Comment, createComment, getCommentsByTask } from "../../services/commentService";
import { Button } from "@/src/components/UI/Buttons";

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to post comment"
      );
    } finally {
      setPostingComment(false);
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