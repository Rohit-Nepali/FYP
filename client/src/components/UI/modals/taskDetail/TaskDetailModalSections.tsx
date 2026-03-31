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
import { TaskPermissions } from "@/src/utils/permissions";

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
  { key: "details", icon: "document-text-outline", label: "Details" },
  { key: "comments", icon: "chatbubble-outline", label: "Comments", countKey: "comments" },
  { key: "status", icon: "flag-outline", label: "Status" },
  { key: "attachments", icon: "attach-outline", label: "Files", countKey: "attachments" },
];

const getPriorityColor = (priorityName?: string) => {
  switch (priorityName?.toLowerCase()) {
    case "high":
    case "urgent":
    case "critical":
      return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", dot: "#EF4444" };
    case "medium":
      return { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", dot: "#F59E0B" };
    case "low":
      return { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", dot: "#10B981" };
    default:
      return { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "#6B7280" };
  }
};

interface HeaderProps {
  title?: string;
  loading: boolean;
  onClose: () => void;
  canDelete?: boolean;
}

export function TaskDetailHeader({ title, loading, onClose }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between p-5 pt-6 bg-gray-900">
      <View className="flex-1 mr-4">
        <Text className="text-2xl font-bold text-white tracking-tight" numberOfLines={1}>
          {loading ? "Loading..." : title || "Task Detail"}
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} className="p-2 -mr-2 rounded-full bg-gray-900">
        <Ionicons name="close" size={24} color="#9CA3AF" />
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
    <View className="flex-row px-2 bg-gray-900 border-b border-gray-800">
      {TABS.map((tab) => {
        const count = tab.countKey ? tabCounts[tab.countKey] : undefined;
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChangeTab(tab.key)}
            className={`flex-1 py-4 items-center border-b-2 ${
              isActive ? "border-white" : "border-transparent"
            }`}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={isActive ? tab.icon.replace("-outline", "") as any : tab.icon}
                size={18}
                color={isActive ? "#FFFFFF" : "#6B7280"}
              />
              <Text className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-500"}`}>
                {tab.label}
              </Text>
              {count !== undefined && count > 0 && (
                <View className={`px-1.5 py-0.5 rounded-full ${isActive ? "bg-white" : "bg-gray-800"}`}>
                  <Text className={`text-[10px] font-bold ${isActive ? "text-black" : "text-gray-400"}`}>
                    {count}
                  </Text>
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
  updatingCompletion: boolean;
  onToggleCompletion: () => void;
  canMarkComplete: boolean;
  projectMembers: ProjectMember[];
  showAssigneePicker: boolean;
  onToggleAssigneePicker: () => void;
  onUpdateAssignee: (memberId: string | undefined) => void;
  canManageAssignees: boolean;
}

export function TaskDetailsTab({
  task,
  isDone,
  formatDate,
  updatingCompletion,
  onToggleCompletion,
  canMarkComplete,
  projectMembers,
  showAssigneePicker,
  onToggleAssigneePicker,
  onUpdateAssignee,
  canManageAssignees,
}: DetailsTabProps) {
  return (
    <View className="px-5 py-6 gap-8">
      {/* Title & Description */}
      <View>
        <View className="flex-row items-start mb-4">
          <TouchableOpacity
            onPress={onToggleCompletion}
            disabled={!canMarkComplete || updatingCompletion}
            className={`w-6 h-6 mt-1 rounded-full border-2 items-center justify-center mr-4 ${
              isDone ? "bg-green-500 border-green-500" : "border-gray-500 bg-transparent"
            } ${!canMarkComplete ? "opacity-50" : ""}`}
          >
            {updatingCompletion ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : isDone ? (
              <Ionicons name="checkmark" size={16} color="#000" />
            ) : null}
          </TouchableOpacity>
          <Text className={`text-xl font-bold flex-1 leading-snug ${isDone ? "text-gray-400 line-through" : "text-white"}`}>
            {task.title}
          </Text>
        </View>
        
        {task.description ? (
          <Text className="text-gray-300 leading-relaxed text-base ml-10">
            {task.description}
          </Text>
        ) : (
          <Text className="text-gray-600 italic ml-10">No description provided</Text>
        )}
      </View>

      <View className="h-px bg-gray-800 ml-10" />

      {/* Meta Information (Due Date & Assignee) without boxes */}
      <View className="ml-10 gap-6">
        {task.dueDate && (
          <View className="flex-row items-center">
            <View className="w-8 items-center justify-center mr-3">
              <Ionicons name="calendar-clear-outline" size={20} color="#6B7280" />
            </View>
            <View>
              <Text className="text-gray-500 text-xs mb-0.5 uppercase tracking-wider font-semibold">Due Date</Text>
              <Text className="text-white text-base">{formatDate(task.dueDate)}</Text>
            </View>
          </View>
        )}

        <View>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className="w-8 items-center justify-center mr-3">
                <Ionicons name="person-outline" size={20} color="#6B7280" />
              </View>
              <Text className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Assignee</Text>
            </View>
            
            {projectMembers.length > 0 && canManageAssignees && (
              <TouchableOpacity onPress={onToggleAssigneePicker}>
                <Text className="text-blue-400 text-sm font-medium">
                  {showAssigneePicker ? "Cancel" : task.assignee ? "Change" : "Assign"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="ml-11">
            {showAssigneePicker ? (
              <View className="flex-row flex-wrap gap-3 mt-2">
                <TouchableOpacity
                  onPress={() => onUpdateAssignee(undefined)}
                  className={`px-4 py-2 rounded-full border items-center ${
                    !task.assigneeId ? "bg-blue-600 border-blue-600" : "bg-gray-900 border-gray-700"
                  }`}
                >
                  <Text className={`text-sm font-medium ${!task.assigneeId ? "text-white" : "text-gray-300"}`}>
                    Unassigned
                  </Text>
                </TouchableOpacity>

                {projectMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => onUpdateAssignee(member.id)}
                    className={`flex-row items-center px-4 py-2 rounded-full border ${
                      task.assigneeId === member.id ? "bg-blue-600 border-blue-600" : "bg-gray-900 border-gray-700"
                    }`}
                  >
                    {member.profileImage ? (
                      <Image
                        source={{ uri: resolveFileUrl(member.profileImage) }}
                        className="w-5 h-5 rounded-full mr-2"
                      />
                    ) : (
                      <View className="w-5 h-5 rounded-full bg-gray-700 items-center justify-center mr-2">
                        <Text className="text-white text-[10px] font-bold">
                          {member.name?.charAt(0)?.toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                    <Text className={`text-sm font-medium ${task.assigneeId === member.id ? "text-white" : "text-gray-300"}`}>
                      {member.name.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="flex-row items-center mt-1">
                {task.assignee ? (
                  <>
                    {task.assignee.profileImage ? (
                      <Image
                        source={{ uri: resolveFileUrl(task.assignee.profileImage) }}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <View className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center">
                        <Text className="text-white text-sm font-bold">
                          {task.assignee.name?.charAt(0)?.toUpperCase() || "?"}
                        </Text>
                      </View>
                    )}
                    <View className="ml-3">
                      <Text className="text-white text-base font-medium">{task.assignee.name}</Text>
                    </View>
                  </>
                ) : (
                  <Text className="text-gray-500 italic text-base">Unassigned</Text>
                )}
              </View>
            )}
          </View>
        </View>
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
  canComment: boolean;
}

export function TaskCommentsTab({
  newComment,
  onChangeComment,
  postingComment,
  onPostComment,
  comments,
  formatDate,
  canComment,
}: CommentsTabProps) {
  return (
    <View className="flex-1 px-4 py-2">
      {/* Comments List */}
      <View className="flex-1 mt-4 mb-20">
        {comments.length === 0 ? (
          <View className="items-center justify-center py-20 opacity-50">
            <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-400 text-base mt-4 font-medium">No comments yet</Text>
            <Text className="text-gray-500 text-sm mt-1">Start the conversation below</Text>
          </View>
        ) : (
          <View className="gap-6">
            {comments.map((comment, index) => {
              // Simple check to see if we should group consecutive comments
              const prevComment = index > 0 ? comments[index - 1] : null;
              const isSameAuthor = prevComment?.author.id === comment.author.id;

              return (
                <View key={comment.id} className={isSameAuthor ? "-mt-4" : ""}>
                  {!isSameAuthor && (
                    <View className="flex-row justify-between items-center mb-1">
                      <View className="flex-row items-center gap-2">
                        {(comment.author as any)?.profileImage ? (
                          <Image
                            source={{ uri: resolveFileUrl((comment.author as any).profileImage) }}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <View className="w-6 h-6 rounded-full bg-gray-800 items-center justify-center">
                            <Text className="text-gray-300 text-[10px] font-bold">
                              {comment.author.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text className="text-white text-sm font-semibold">{comment.author.name}</Text>
                      </View>
                      <Text className="text-gray-500 text-xs">{formatDate(comment.createdAt)}</Text>
                    </View>
                  )}
                  <Text className="text-gray-300 text-[15px] leading-relaxed ml-8">
                    {comment.content}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Input Area - Pill shaped and floating at bottom */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-gray-950 border-t border-gray-900">
        {canComment ? (
          <View className="flex-row items-end gap-2 bg-gray-900 rounded-3xl pl-5 pr-2 py-1.5 border border-gray-800">
            <TextInput
              className="flex-1 text-white text-base min-h-[40px] max-h-[100px] pt-2.5 pb-2"
              placeholder="Message..."
              placeholderTextColor="#6B7280"
              value={newComment}
              onChangeText={onChangeComment}
              multiline
              textAlignVertical="center"
            />
            <TouchableOpacity
              onPress={onPostComment}
              disabled={!newComment.trim() || postingComment}
              className={`w-10 h-10 rounded-full items-center justify-center mb-0.5 ${
                newComment.trim() && !postingComment ? "bg-white" : "bg-transparent"
              }`}
            >
              {postingComment ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={newComment.trim() ? "#000" : "#4B5563"}
                />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-gray-900 rounded-full py-3 items-center flex-row justify-center gap-2">
            <Ionicons name="lock-closed" size={16} color="#6B7280" />
            <Text className="text-gray-500 text-sm font-medium">Commenting is disabled</Text>
          </View>
        )}
      </View>
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
  canManageStatus: boolean;
  canEdit: boolean;
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
  canManageStatus,
  canEdit,
}: StatusTabProps) {
  return (
    <View className="p-5 gap-8">
      
      {/* Status Section */}
      <View>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold tracking-tight">Status</Text>
          {updatingStatus && <ActivityIndicator size="small" color="#fff" />}
          {!canManageStatus && <Text className="text-gray-500 text-xs uppercase tracking-wider">Read-Only</Text>}
        </View>

        {statuses.length > 0 ? (
          <View className="flex-row flex-wrap gap-3">
            {statuses.map((status) => {
              const isSelected = task.statusId === status.id;
              return (
                <TouchableOpacity
                  key={status.id}
                  onPress={() => onUpdateStatus(status.id)}
                  disabled={updatingStatus || !canManageStatus}
                  className={`px-5 py-2.5 rounded-full border ${
                    isSelected
                      ? "bg-white border-white"
                      : "bg-gray-900 border-gray-800"
                  }`}
                >
                  <Text className={`text-sm font-semibold ${isSelected ? "text-black" : "text-gray-400"}`}>
                    {status.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text className="text-white text-base">{task.status?.name || "Not set"}</Text>
        )}
      </View>

      <View className="h-px bg-gray-800" />

      {/* Priority Section */}
      <View>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold tracking-tight">Priority</Text>
          {updatingPriority && <ActivityIndicator size="small" color="#fff" />}
          {!canEdit && <Text className="text-gray-500 text-xs uppercase tracking-wider">Read-Only</Text>}
        </View>

        {priorities.length > 0 ? (
          <View className="gap-2">
            {priorities.map((priority) => {
              const isSelected = task.priorityId === priority.id;
              const style = getPriorityColor(priority.name);

              return (
                <TouchableOpacity
                  key={priority.id}
                  onPress={() => onUpdatePriority(priority.id)}
                  disabled={updatingPriority || !canEdit}
                  className={`flex-row items-center justify-between px-4 py-3 rounded-2xl border ${
                    isSelected ? style.border + " " + style.bg : "border-transparent bg-gray-900/50"
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.dot }} />
                    <Text className={`text-base font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                      {priority.name}
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text className="text-white text-base">{task.priority?.name || "Not set"}</Text>
        )}
      </View>

      <View className="h-px bg-gray-800" />

      {/* Meta Footer */}
      <View className="flex-row justify-between items-center opacity-70 mt-2">
        <Text className="text-gray-500 text-sm">Created At</Text>
        <Text className="text-gray-400 text-sm font-medium">{formatDate(task.createdAt)}</Text>
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
  canUploadAttachments: boolean;
  canViewAttachments: boolean;
}

export function TaskAttachmentsTab({
  attachments,
  uploadingAttachment,
  onUploadAttachment,
  onSelectAttachment,
  formatDate,
  canUploadAttachments,
  canViewAttachments,
}: AttachmentsTabProps) {
  return (
    <View className="flex-1 p-5 gap-4">
      {!canViewAttachments ? (
        <View className="items-center justify-center py-16 opacity-80">
          <Ionicons name="lock-closed-outline" size={44} color="#6B7280" />
          <Text className="text-gray-400 text-base mt-4 font-medium">Files are restricted</Text>
          <Text className="text-gray-500 text-sm mt-1">You do not have permission to view attachments.</Text>
        </View>
      ) : (
        <>
      
      {/* Minimal Upload Button */}
      {canUploadAttachments && (
        <TouchableOpacity
          onPress={onUploadAttachment}
          disabled={uploadingAttachment}
          className="flex-row items-center justify-center py-3 bg-gray-900 rounded-2xl border border-gray-800 mb-2"
        >
          {uploadingAttachment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add" size={20} color="#fff" />
              <Text className="text-white font-medium ml-1">Add File</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Clean List */}
      <View>
        {attachments.length === 0 ? (
          <View className="items-center justify-center py-16 opacity-50">
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-400 text-base mt-4 font-medium">No files yet</Text>
          </View>
        ) : (
          attachments.map((attachment, index) => {
            const attachmentType = getAttachmentType(attachment.fileType);
            const isImage = attachmentType === "image";
            const isLast = index === attachments.length - 1;

            return (
              <TouchableOpacity
                key={attachment.id}
                onPress={() => onSelectAttachment(attachment)}
                className={`flex-row items-center py-4 ${!isLast ? "border-b border-gray-800/50" : ""}`}
              >
                {isImage ? (
                  <Image
                    source={{ uri: resolveFileUrl(attachment.fileUrl) }}
                    className="w-12 h-12 rounded-xl bg-gray-900"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-xl bg-gray-900 items-center justify-center">
                    <Ionicons 
                      name={attachmentType === "document" ? "document-text" : "document-attach"} 
                      size={20} 
                      color="#9CA3AF" 
                    />
                  </View>
                )}

                <View className="ml-4 flex-1 justify-center">
                  <Text className="text-white text-base font-medium mb-0.5" numberOfLines={1}>
                    {attachment.fileName}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {formatFileSize(attachment.fileSize)} • {formatDate(attachment.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
      </>
      )}
    </View>
  );
}