import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Task } from "@/src/services/taskService";
import { Comment } from "@/src/services/commentService";
import {
  Attachment,
  formatFileSize,
  getAttachmentType,
} from "@/src/services/attachmentService";
import { resolveFileUrl } from "@/src/utils/url";

export type TaskDetailTabKey =
  | "details"
  | "comments"
  | "status"
  | "attachments";

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

interface StatusOption {
  id: string;
  name: string;
}

interface PriorityOption {
  id: string;
  name: string;
}

const TABS: Array<{
  key: TaskDetailTabKey;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  countKey?: "comments" | "attachments";
}> = [
  {
    key: "details",
    icon: "document-text-outline",
    label: "Details",
  },
  {
    key: "comments",
    icon: "chatbubble-outline",
    label: "Comments",
    countKey: "comments",
  },
  {
    key: "status",
    icon: "flag-outline",
    label: "Status",
  },
  {
    key: "attachments",
    icon: "attach-outline",
    label: "Files",
    countKey: "attachments",
  },
];

const getPriorityColor = (priorityName?: string) => {
  switch (priorityName?.toLowerCase()) {
    case "high":
    case "urgent":
    case "critical":
      return { bg: "bg-red-600", border: "border-red-400", dot: "#EF4444" };
    case "medium":
      return {
        bg: "bg-yellow-600",
        border: "border-yellow-400",
        dot: "#F59E0B",
      };
    case "low":
      return {
        bg: "bg-green-600",
        border: "border-green-400",
        dot: "#10B981",
      };
    default:
      return { bg: "bg-blue-600", border: "border-blue-400", dot: "#6B7280" };
  }
};

interface HeaderProps {
  title?: string;
  loading: boolean;
  onClose: () => void;
}

export function TaskDetailHeader({ title, loading, onClose }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50">
      <View className="flex-1 mr-4">
        <Text className="text-xl font-bold text-white" numberOfLines={1}>
          {loading ? "Loading..." : title || "Task Detail"}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} className="p-1">
        <Ionicons name="close-circle" size={30} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

interface TabBarProps {
  activeTab: TaskDetailTabKey;
  onChangeTab: (tab: TaskDetailTabKey) => void;
  commentsCount: number;
  attachmentsCount: number;
}

export function TaskDetailTabBar({
  activeTab,
  onChangeTab,
  commentsCount,
  attachmentsCount,
}: TabBarProps) {
  const tabCounts = {
    comments: commentsCount,
    attachments: attachmentsCount,
  };

  return (
    <View className="flex-row border-b border-gray-700 bg-gray-900/30">
      {TABS.map((tab) => {
        const count = tab.countKey ? tabCounts[tab.countKey] : undefined;

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChangeTab(tab.key)}
            className={`flex-1 py-3 items-center border-b-2 ${
              activeTab === tab.key ? "border-blue-500" : "border-transparent"
            }`}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? "#60A5FA" : "#6B7280"}
            />
            <View className="flex-row items-center gap-1 mt-1">
              <Text
                className={`text-xs font-medium ${
                  activeTab === tab.key ? "text-white" : "text-gray-400"
                }`}
              >
                {tab.label}
              </Text>
              {count !== undefined && count > 0 && (
                <View className="bg-gray-700 px-1.5 rounded-full min-w-[18px] items-center">
                  <Text className="text-xs text-gray-300 font-semibold">{count}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface DetailsTabProps {
  task: Task;
  isDone: boolean;
  formatDate: (dateString?: string) => string;
  projectMembers: ProjectMember[];
  showAssigneePicker: boolean;
  onToggleAssigneePicker: () => void;
  onUpdateAssignee: (memberId: string | undefined) => void;
}

export function TaskDetailsTab({
  task,
  isDone,
  formatDate,
  projectMembers,
  showAssigneePicker,
  onToggleAssigneePicker,
  onUpdateAssignee,
}: DetailsTabProps) {
  return (
    <View className="gap-4">
      <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
        <View className="flex-row items-start mb-3">
          <View
            className={`w-7 h-7 rounded-full items-center justify-center ${
              isDone ? "bg-green-500/20" : "bg-gray-700"
            }`}
          >
            <Ionicons
              name={isDone ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={isDone ? "#10B981" : "#9CA3AF"}
            />
          </View>
          <Text className="text-white text-lg font-bold ml-3 flex-1 leading-snug">
            {task.title}
          </Text>
        </View>
        {task.description ? (
          <Text className="text-gray-300 leading-relaxed text-base ml-10">
            {task.description}
          </Text>
        ) : (
          <Text className="text-gray-500 italic ml-10">No description provided</Text>
        )}
      </View>

      {task.dueDate && (
        <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-blue-900/30 items-center justify-center">
            <Ionicons name="calendar-outline" size={18} color="#60A5FA" />
          </View>
          <View className="ml-3">
            <Text className="text-gray-400 text-xs">Due Date</Text>
            <Text className="text-white font-medium">{formatDate(task.dueDate)}</Text>
          </View>
        </View>
      )}

      <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="person-outline" size={20} color="#60A5FA" />
            <Text className="text-gray-300 font-medium">Assignee</Text>
          </View>
          {projectMembers.length > 0 && (
            <TouchableOpacity
              onPress={onToggleAssigneePicker}
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
              onPress={() => onUpdateAssignee(undefined)}
              className={`px-3 py-2 rounded-lg border-2 items-center min-w-[70px] ${
                !task.assigneeId
                  ? "bg-blue-600 border-blue-400"
                  : "bg-gray-800 border-gray-700"
              }`}
            >
              <Ionicons
                name="person-remove-outline"
                size={20}
                color={!task.assigneeId ? "#fff" : "#9CA3AF"}
              />
              <Text
                className={`text-xs mt-1 ${
                  !task.assigneeId ? "text-white" : "text-gray-400"
                }`}
              >
                None
              </Text>
            </TouchableOpacity>

            {projectMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                onPress={() => onUpdateAssignee(member.id)}
                className={`px-3 py-2 rounded-lg border-2 items-center min-w-[70px] ${
                  task.assigneeId === member.id
                    ? "bg-blue-600 border-blue-400"
                    : "bg-gray-800 border-gray-700"
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
                <Text
                  className={`text-xs text-center ${
                    task.assigneeId === member.id ? "text-white" : "text-gray-400"
                  }`}
                  numberOfLines={1}
                >
                  {member.name.split(" ")[0]}
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
  );
}

interface CommentsTabProps {
  newComment: string;
  onChangeComment: (value: string) => void;
  postingComment: boolean;
  onPostComment: () => void;
  comments: Comment[];
  formatDate: (dateString?: string) => string;
}

export function TaskCommentsTab({
  newComment,
  onChangeComment,
  postingComment,
  onPostComment,
  comments,
  formatDate,
}: CommentsTabProps) {
  return (
    <View className="gap-4">
      <View className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
        <View className="flex-row items-end gap-2">
          <TextInput
            className="flex-1 bg-gray-900 rounded-xl px-4 py-3 text-white min-h-[44px] max-h-[120px] border border-gray-700"
            placeholder="Write a comment..."
            placeholderTextColor="#6B7280"
            value={newComment}
            onChangeText={onChangeComment}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            onPress={onPostComment}
            disabled={!newComment.trim() || postingComment}
            className={`w-11 h-11 rounded-xl items-center justify-center ${
              newComment.trim() && !postingComment ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            {postingComment ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={newComment.trim() ? "#fff" : "#6B7280"}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {comments.length === 0 ? (
        <View className="items-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <Ionicons name="chatbubble-outline" size={40} color="#4B5563" />
          <Text className="text-gray-400 text-sm mt-3 font-medium">No comments yet</Text>
          <Text className="text-gray-600 text-xs mt-1">Be the first to comment</Text>
        </View>
      ) : (
        comments.map((comment) => (
          <View
            key={comment.id}
            className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50"
          >
            <View className="flex-row items-center mb-2">
              {(comment.author as any)?.profileImage ? (
                <Image
                  source={{ uri: resolveFileUrl((comment.author as any).profileImage) }}
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <View className="w-7 h-7 rounded-full bg-blue-900/50 items-center justify-center border border-blue-500/30">
                  <Text className="text-blue-400 text-xs font-bold">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="flex-1 ml-2">
                <Text className="text-gray-300 text-sm font-medium">{comment.author.name}</Text>
                <Text className="text-gray-500 text-xs">{formatDate(comment.createdAt)}</Text>
              </View>
            </View>
            <Text className="text-gray-300 text-sm leading-relaxed ml-9">{comment.content}</Text>
          </View>
        ))
      )}
    </View>
  );
}

interface StatusTabProps {
  task: Task;
  statuses: StatusOption[];
  priorities: PriorityOption[];
  updatingStatus: boolean;
  updatingPriority: boolean;
  onUpdateStatus: (statusId: string) => void;
  onUpdatePriority: (priorityId: string) => void;
  formatDate: (dateString?: string) => string;
}

export function TaskStatusTab({
  task,
  statuses,
  priorities,
  updatingStatus,
  updatingPriority,
  onUpdateStatus,
  onUpdatePriority,
  formatDate,
}: StatusTabProps) {
  return (
    <View className="gap-4">
      <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-8 h-8 rounded-full bg-yellow-900/30 items-center justify-center">
            <Ionicons name="flag" size={16} color="#FBBF24" />
          </View>
          <Text className="text-white font-semibold">Status</Text>
          {updatingStatus && (
            <ActivityIndicator size="small" color="#60A5FA" style={{ marginLeft: 8 }} />
          )}
        </View>

        {statuses.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {statuses.map((status) => {
              const isSelected = task.statusId === status.id;

              return (
                <TouchableOpacity
                  key={status.id}
                  onPress={() => onUpdateStatus(status.id)}
                  disabled={updatingStatus}
                  className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl border-2 ${
                    isSelected
                      ? "bg-yellow-600 border-yellow-400"
                      : "bg-gray-800 border-gray-700"
                  }`}
                >
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  )}
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? "text-white" : "text-gray-300"
                    }`}
                  >
                    {status.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className="flex-row items-center gap-2 py-2">
            <Text className="text-gray-400 text-sm">Current:</Text>
            <View className="px-3 py-1 rounded-full bg-yellow-900/30 border border-yellow-700/50">
              <Text className="text-yellow-500 text-sm font-medium">
                {task.status?.name || "Not set"}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-8 h-8 rounded-full bg-red-900/30 items-center justify-center">
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
          </View>
          <Text className="text-white font-semibold">Priority</Text>
          {updatingPriority && (
            <ActivityIndicator size="small" color="#60A5FA" style={{ marginLeft: 8 }} />
          )}
        </View>

        {priorities.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {priorities.map((priority) => {
              const isSelected = task.priorityId === priority.id;
              const priorityColor = getPriorityColor(priority.name);

              return (
                <TouchableOpacity
                  key={priority.id}
                  onPress={() => onUpdatePriority(priority.id)}
                  disabled={updatingPriority}
                  className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl border-2 ${
                    isSelected
                      ? `${priorityColor.bg} ${priorityColor.border}`
                      : "bg-gray-800 border-gray-700"
                  }`}
                >
                  <View
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: isSelected ? "#fff" : priorityColor.dot,
                    }}
                  />
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? "text-white" : "text-gray-300"
                    }`}
                  >
                    {priority.name}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className="flex-row items-center gap-2 py-2">
            <Text className="text-gray-400 text-sm">Current:</Text>
            <View className="px-3 py-1 rounded-full bg-red-900/30 border border-red-700/50">
              <Text className="text-red-400 text-sm font-medium">
                {task.priority?.name || "Not set"}
              </Text>
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
        <Text className="text-gray-400 text-sm">{formatDate(task.createdAt)}</Text>
      </View>
    </View>
  );
}

interface AttachmentsTabProps {
  attachments: Attachment[];
  uploadingAttachment: boolean;
  onUploadAttachment: () => void;
  onSelectAttachment: (attachment: Attachment) => void;
  formatDate: (dateString?: string) => string;
}

export function TaskAttachmentsTab({
  attachments,
  uploadingAttachment,
  onUploadAttachment,
  onSelectAttachment,
  formatDate,
}: AttachmentsTabProps) {
  return (
    <View className="gap-3">
      <TouchableOpacity
        onPress={onUploadAttachment}
        disabled={uploadingAttachment}
        className="bg-blue-600 rounded-xl py-3.5 px-4 items-center justify-center flex-row active:bg-blue-700"
      >
        {uploadingAttachment ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text className="text-white font-semibold ml-2">Upload Files</Text>
          </>
        )}
      </TouchableOpacity>

      {attachments.length === 0 ? (
        <View className="items-center py-12 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
          <View className="w-16 h-16 rounded-full bg-gray-700/50 items-center justify-center mb-3">
            <Ionicons name="cloud-upload-outline" size={32} color="#6B7280" />
          </View>
          <Text className="text-gray-400 text-base font-medium">No files attached</Text>
          <Text className="text-gray-600 text-xs mt-1">
            Upload documents, images, or other files
          </Text>
        </View>
      ) : (
        attachments.map((attachment) => {
          const attachmentType = getAttachmentType(attachment.fileType);
          const isImage = attachmentType === "image";
          const iconName =
            attachmentType === "image"
              ? "image-outline"
              : attachmentType === "document"
              ? "document-text-outline"
              : "attach-outline";

          return (
            <TouchableOpacity
              key={attachment.id}
              onPress={() => onSelectAttachment(attachment)}
              className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 active:bg-gray-700/50"
            >
              <View className="flex-row items-center">
                {isImage ? (
                  <Image
                    source={{
                      uri: resolveFileUrl(attachment.fileUrl),
                    }}
                    className="w-12 h-12 rounded-lg bg-gray-700"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-lg bg-gray-700 items-center justify-center">
                    <Ionicons name={iconName as any} size={24} color="#60A5FA" />
                  </View>
                )}

                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium" numberOfLines={1}>
                    {attachment.fileName}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-0.5">
                    {formatFileSize(attachment.fileSize)} • {formatDate(attachment.createdAt)}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}
