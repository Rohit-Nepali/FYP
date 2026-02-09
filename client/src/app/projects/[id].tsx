import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { getProjectById, deleteProject, Project } from "../../services/projectService";
import { getProjectAttachments, Attachment } from "../../services/attachmentService";
import ProjectTasksList from "../../components/ProjectTasksList";
import AddMembersModal from "../../components/UI/AddMembersModal";
import InviteMemberModal from "../../components/UI/InviteMemberModal";
import AttachmentGrid from "../../components/UI/AttachmentGrid";
import AttachmentPreviewModal from "../../components/UI/AttachmentPreviewModal";
import UploadAttachmentModal from "../../components/UI/UploadAttachmentModal";
import ActivitySection from "../../components/ActivitySection";
import ProjectStatusReport from "../../components/ProjectStatusReport";

interface ProjectData extends Project {
  tasks?: any[];
}

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks'>('tasks');
  const [addMembersModalVisible, setAddMembersModalVisible] = useState(false);
  const [inviteEmailModalVisible, setInviteEmailModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'document' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadProjectDetail(id);
      loadAttachments(id);
    }
  }, [id]);

  const loadAttachments = async (projectId: string) => {
    try {
      setAttachmentsLoading(true);
      const data = await getProjectAttachments(projectId);
      setAttachments(data);
    } catch (err) {
      console.error("Failed to load attachments", err);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const loadProjectDetail = async (projectId: string) => {
    try {
      setLoading(true);
      const data = await getProjectById(projectId);
      console.log(" project details", JSON.stringify(data, null, 2));
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
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-blue-600 rounded-lg px-6 py-3"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const taskCount = project.tasks?.length || 0;
  const memberCount = project.members?.length || 0;

  const members = project.members || [];
  const previewMembers = members.slice(0, 3);
  const extraCount = memberCount - previewMembers.length;

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  const existingMemberIds = project?.members?.map((m: any) => m.userId || m.id) || [];

  const getAttachmentType = (fileType: string | null): 'image' | 'document' | 'other' => {
    if (!fileType) return 'other';
    if (fileType.startsWith('image/')) return 'image';
    if (
      fileType.includes('pdf') ||
      fileType.includes('document') ||
      fileType.includes('text') ||
      fileType.includes('spreadsheet') ||
      fileType.includes('presentation')
    ) {
      return 'document';
    }
    return 'other';
  };

  // Filter attachments
  const filteredAttachments = attachments.filter(attachment => {
    // Filter by type
    if (filterType !== 'all') {
      if (getAttachmentType(attachment.fileType) !== filterType) {
        return false;
      }
    }
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return attachment.fileName.toLowerCase().includes(query);
    }
    return true;
  });

  const handleAttachmentPress = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setPreviewModalVisible(true);
  };

  const handleUploadSuccess = () => {
    if (id && typeof id === 'string') {
      loadAttachments(id);
    }
  };

  const handleDeleteProject = () => {
    console.log("Deleting project")
    setMenuVisible(false);
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteProject(id as string);
              Alert.alert(
                "Success",
                "Project has been deleted successfully.",
                [{ text: "OK", onPress: () => router.back() }]
              );
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Failed to delete project"
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

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
            {project.title || "Project"}
          </Text>

          {/* Contextual actions */}
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Modal */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View className="absolute top-16 right-6 bg-gray-800 rounded-xl border border-gray-700 p-1 shadow-xl w-56 z-50">
            <TouchableOpacity
              className="flex-row items-center p-3 rounded-lg active:bg-gray-700"
              onPress={() => {
                setMenuVisible(false);
                setAddMembersModalVisible(true);
              }}
            >
              <Ionicons name="person-add-outline" size={20} color="#fff" />
              <Text className="text-white ml-3 font-medium">Add Members</Text>
            </TouchableOpacity>
            
            <View className="h-px bg-gray-700 my-1" />
            
            {/* Owner-only options */}
            {project.ownerId === user?.id && (
              <>
                <TouchableOpacity
                  className="flex-row items-center p-3 rounded-lg active:bg-gray-700"
                  onPress={() => {
                    setMenuVisible(false);
                    router.push(`/projects/${id}/statuses`);
                  }}
                >
                  <Ionicons name="list-outline" size={20} color="#fff" />
                  <Text className="text-white ml-3 font-medium">Manage Statuses</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-row items-center p-3 rounded-lg active:bg-gray-700"
                  onPress={() => {
                    setMenuVisible(false);
                    router.push(`/projects/${id}/priorities`);
                  }}
                >
                  <Ionicons name="flag-outline" size={20} color="#fff" />
                  <Text className="text-white ml-3 font-medium">Manage Priorities</Text>
                </TouchableOpacity>
                
                <View className="h-px bg-gray-700 my-1" />
              </>
            )}
            
            <TouchableOpacity
              className="flex-row items-center p-3 rounded-lg active:bg-red-900/30"
              onPress={handleDeleteProject}
              disabled={deleting}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text className="text-red-500 ml-3 font-medium">
                {deleting ? "Deleting..." : "Delete Project"}
              </Text>
            </TouchableOpacity>
            
            <View className="h-px bg-gray-700 my-1" />
            
            <TouchableOpacity
              className="flex-row items-center p-3 rounded-lg active:bg-gray-700"
              onPress={() => {
                setMenuVisible(false);
                setInviteEmailModalVisible(true);
              }}
            >
              <Ionicons name="mail-outline" size={20} color="#fff" />
              <Text className="text-white ml-3 font-medium">Invite via Email</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <AddMembersModal
        visible={addMembersModalVisible}
        onClose={() => setAddMembersModalVisible(false)}
        projectId={id as string}
        onSuccess={() => loadProjectDetail(id as string)}
        existingMemberIds={existingMemberIds}
      />

      <InviteMemberModal
        visible={inviteEmailModalVisible}
        onClose={() => setInviteEmailModalVisible(false)}
        projectId={id as string}
        onSuccess={() => loadProjectDetail(id as string)}
      />

      {/* Attachment Preview Modal */}
      <AttachmentPreviewModal
        visible={previewModalVisible}
        attachment={selectedAttachment}
        onClose={() => setPreviewModalVisible(false)}
      />

      {/* Upload Attachment Modal */}
      <UploadAttachmentModal
        visible={uploadModalVisible}
        projectId={id as string}
        projectTitle={project?.title || 'Project'}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={handleUploadSuccess}
      />

      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Project summary */}
        <View className="bg-gray-800 rounded-2xl p-4 border mb-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mr-3">
              <Ionicons name="folder-outline" size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text
                className="text-white font-semibold text-lg"
                numberOfLines={1}
              >
                {project.title}
              </Text>
              {project.description ? (
                <Text
                  className="text-gray-400 text-xs mt-1"
                  numberOfLines={2}
                >
                  {project.description}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="flex-row items-center mt-3">
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#9CA3AF"
            />
            <Text className="text-gray-400 text-xs ml-2">
              Created {formatDate(project.createdAt)}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-3 mb-6">
          {/* Members card – now tappable */}
          <TouchableOpacity
            onPress={() => router.push(`/projects/${id}/members`)}
            className="flex-1 bg-gray-800 rounded-xl px-3 py-3 border border-gray-700 flex-row items-center justify-between"
            activeOpacity={0.8}
          >
            <View>
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={18} color="#60A5FA" />
                <Text className="text-gray-400 text-xs ml-2">Members</Text>
              </View>
              <Text className="text-white font-semibold text-base mt-1">
                {memberCount} member{memberCount === 1 ? "" : "s"}
              </Text>
            </View>

            {/* Avatar group */}
            <View className="flex-row items-center">
              {previewMembers.map((member: any, index: number) => {
                const name =
                  member.name || member.fullName || member.username || "User";
                const initials = getInitials(name);

                const avatar = member.avatarUrl;

                return (
                  <View
                    key={member.id ?? index}
                    style={{ marginLeft: index === 0 ? 0 : -10 }}
                  >
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        className="w-8 h-8 rounded-full border-2 border-gray-900"
                      />
                    ) : (
                      <View className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 items-center justify-center">
                        <Text className="text-xs text-white font-semibold">
                          {initials}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {extraCount > 0 && (
                <View
                  className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 items-center justify-center ml-1"
                >
                  <Text className="text-xs text-gray-200 font-semibold">
                    +{extraCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View className="flex-row bg-gray-800 rounded-xl p-1 mb-6">
          <TouchableOpacity
            onPress={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 px-4 rounded-lg ${activeTab === 'dashboard' ? 'bg-gray-700' : ''}`}
          >
            <Text className={`text-center font-medium ${activeTab === 'dashboard' ? 'text-white' : 'text-gray-400'}`}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('tasks')}
            className={`flex-1 py-2 px-4 rounded-lg ${activeTab === 'tasks' ? 'bg-gray-700' : ''}`}
          >
            <Text className={`text-center font-medium ${activeTab === 'tasks' ? 'text-white' : 'text-gray-400'}`}>
              Tasks ({taskCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <View className="space-y-4">
            {/* Project Status Report */}
            <ProjectStatusReport projectId={id as string} />

            {/* Recent Activity */}
            <ActivitySection projectId={id as string} />

            {/* Attachments Section */}
            <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="attach-outline" size={18} color="#60A5FA" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Attachments ({filteredAttachments.length})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setUploadModalVisible(true)}
                  className="flex-row items-center bg-blue-600 px-3 py-1.5 rounded-lg"
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text className="text-white text-sm font-medium ml-1">Add</Text>
                </TouchableOpacity>
              </View>

              {/* Filter Tabs */}
              <View className="flex-row bg-gray-900 rounded-lg p-1 mb-3">
                {(['all', 'image', 'document', 'other'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setFilterType(type)}
                    className={`flex-1 py-1.5 rounded-md ${filterType === type ? 'bg-gray-700' : ''}`}
                  >
                    <Text className={`text-center text-xs font-medium ${filterType === type ? 'text-white' : 'text-gray-400'}`}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Search Bar */}
              <View className="flex-row items-center bg-gray-900 rounded-lg px-3 py-2 mb-3">
                <Ionicons name="search-outline" size={16} color="#6B7280" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search attachments..."
                  placeholderTextColor="#6B7280"
                  className="flex-1 ml-2 text-white text-sm"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Attachments Grid or Empty State */}
              {attachmentsLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="small" color="#60A5FA" />
                </View>
              ) : filteredAttachments.length > 0 ? (
                <AttachmentGrid
                  attachments={filteredAttachments}
                  onAttachmentPress={handleAttachmentPress}
                />
              ) : (
                <View className="items-center py-8">
                  <Ionicons name="folder-open-outline" size={48} color="#6B7280" />
                  <Text className="text-gray-400 text-sm mt-2">
                    No attachments in your project
                  </Text>
                  <TouchableOpacity
                    onPress={() => setUploadModalVisible(true)}
                    className="flex-row items-center mt-3 bg-blue-600 px-4 py-2 rounded-lg"
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text className="text-white text-sm font-medium ml-2">
                      Add attachments to your project
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tasks Content - Embedded View */}
        {activeTab === 'tasks' && id && typeof id === 'string' && (
          <ProjectTasksList projectId={id} />
        )}

      </ScrollView>
    </SafeAreaView >
  );
}