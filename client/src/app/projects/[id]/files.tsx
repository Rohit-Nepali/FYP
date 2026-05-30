import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useAuth } from "@/src/contexts/AuthContext";
import { getProjectById, Project } from "@/src/services/projectService";
import {
  getProjectAttachments,
  deleteProjectAttachment,
  Attachment,
} from "@/src/services/attachmentService";
import AttachmentGrid from "@/src/components/UI/AttachmentGrid";
import AttachmentPreviewModal from "@/src/components/UI/modals/AttachmentPreviewModal";
import UploadAttachmentModal from "@/src/components/UI/modals/UploadAttachmentModal";
import CustomAlert from "@/src/components/UI/CustomAlert";
import { Button } from "@/src/components/UI/Buttons";
import useAlert from "@/src/hooks/useAlert";

interface ProjectData extends Project {
  members?: any[];
  tasks?: any[];
}

export default function ProjectFiles() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { showError, AlertComponent } = useAlert();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState(false);
  const [filterType, setFilterType] = useState<
    "all" | "image" | "document" | "other"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedAttachment, setSelectedAttachment] =
    useState<Attachment | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [deletingAttachment, setDeletingAttachment] = useState(false);

  const loadProjectDetail = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      const data = await getProjectById(projectId);
      setProject(data);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to load project"
      );
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadAttachments = useCallback(async (projectId: string) => {
    try {
      setAttachmentsLoading(true);
      setAttachmentsError(false);
      const data = await getProjectAttachments(projectId);
      setAttachments(data);
    } catch (err) {
      console.error("Failed to load attachments", err);
      setAttachmentsError(true);
    } finally {
      setAttachmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadProjectDetail(id);
      loadAttachments(id);
    }
  }, [id, loadProjectDetail, loadAttachments]);

  const handleRefresh = useCallback(async () => {
    if (!id || typeof id !== "string") return;
    setRefreshing(true);
    await Promise.all([loadProjectDetail(id), loadAttachments(id)]);
    setRefreshing(false);
  }, [id, loadProjectDetail, loadAttachments]);

  const getAttachmentType = (
    fileType: string | null
  ): "image" | "document" | "other" => {
    if (!fileType) return "other";
    if (fileType.startsWith("image/")) return "image";
    if (
      fileType.includes("pdf") ||
      fileType.includes("document") ||
      fileType.includes("text") ||
      fileType.includes("spreadsheet") ||
      fileType.includes("presentation")
    ) {
      return "document";
    }
    return "other";
  };

  const filteredAttachments = useMemo(() => {
    return attachments.filter((attachment) => {
      if (
        filterType !== "all" &&
        getAttachmentType(attachment.fileType) !== filterType
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        return attachment.fileName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [attachments, filterType, searchQuery]);

  const handleAttachmentPress = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setPreviewModalVisible(true);
  };

  const isOwner = project?.ownerId === user?.id;

  const handleDeleteAttachment = useCallback(() => {
    if (!id || typeof id !== "string" || !selectedAttachment) return;
    if (!isOwner) {
      showError("Only the project owner can remove attachments", "Permission Denied");
      return;
    }

    Alert.alert(
      "Remove Attachment",
      `Remove "${selectedAttachment.fileName}" from this project? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingAttachment(true);
              await deleteProjectAttachment(id, selectedAttachment.id);
              setAttachments((prev) =>
                prev.filter((item) => item.id !== selectedAttachment.id)
              );
              setSelectedAttachment(null);
            } catch (error) {
              console.error("Failed to delete project attachment", error);
              showError(
                error instanceof Error ? error.message : "Failed to remove attachment",
                "Delete Failed"
              );
            } finally {
              setDeletingAttachment(false);
            }
          },
        },
      ]
    );
  }, [id, isOwner, selectedAttachment, showError]);

  const handleUploadSuccess = () => {
    if (id && typeof id === "string") {
      loadAttachments(id);
    }
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

  return (
    <View className="flex-1 bg-gray-900">
      <SafeAreaView className="flex-1 bg-gray-900">
        <Animated.View entering={FadeInUp.duration(300)}>
          <View className="px-5 pt-4 pb-3 border-b border-gray-800/80">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-gray-800/60 rounded-xl p-2"
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>

              <View className="flex-1 mx-3">
                <Text className="text-white text-lg font-bold" numberOfLines={1}>
                  {project.title}
                </Text>
                <Text className="text-gray-500 text-xs mt-0.5">Files</Text>
              </View>

              <TouchableOpacity
                onPress={() => setUploadModalVisible(true)}
                className="bg-blue-500/15 border border-blue-500/30 rounded-xl px-3 py-2 flex-row items-center"
              >
                <Ionicons name="cloud-upload-outline" size={14} color="#60A5FA" />
                <Text className="text-blue-400 text-xs font-medium ml-1.5">
                  Upload
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#60A5FA"
              colors={["#60A5FA"]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(350)}>
            <View className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/40">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-white font-semibold text-base">
                    Attachments
                  </Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    {filteredAttachments.length} shown
                  </Text>
                </View>
                <View className="bg-gray-700/40 rounded-xl px-3 py-1.5">
                  <Text className="text-gray-300 text-xs font-medium">
                    {attachments.length} total
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-3"
                contentContainerStyle={{ gap: 8 }}
              >
                {(["all", "image", "document", "other"] as const).map(
                  (type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setFilterType(type)}
                      className={`px-3 py-1.5 rounded-xl border ${filterType === type
                          ? "bg-blue-500/15 border-blue-500/30"
                          : "bg-gray-700/30 border-gray-700/50"
                        }`}
                    >
                      <Text
                        className={`text-xs font-medium ${filterType === type
                            ? "text-blue-400"
                            : "text-gray-400"
                          }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              <View className="flex-row items-center bg-gray-900/60 rounded-xl px-3 py-2.5 mb-3 border border-gray-700/30">
                <Ionicons name="search-outline" size={16} color="#6B7280" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search files..."
                  placeholderTextColor="#4B5563"
                  className="flex-1 ml-2 text-white text-sm"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("") }>
                    <Ionicons name="close-circle" size={16} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              {attachmentsLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="small" color="#60A5FA" />
                  <Text className="text-gray-500 text-xs mt-2">
                    Loading files...
                  </Text>
                </View>
              ) : attachmentsError ? (
                <View className="items-center py-8">
                  <View className="bg-red-500/10 rounded-full p-3 mb-2">
                    <Ionicons
                      name="cloud-offline-outline"
                      size={24}
                      color="#F87171"
                    />
                  </View>
                  <Text className="text-gray-400 text-sm">
                    Failed to load attachments
                  </Text>
                  <TouchableOpacity
                    onPress={() => loadAttachments(id as string)}
                    className="mt-2 bg-gray-700/50 px-4 py-2 rounded-xl"
                  >
                    <Text className="text-blue-400 text-xs font-medium">
                      Retry
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : filteredAttachments.length > 0 ? (
                <AttachmentGrid
                  attachments={filteredAttachments}
                  onAttachmentPress={handleAttachmentPress}
                />
              ) : (
                <View className="items-center py-8">
                  <View className="bg-gray-700/20 rounded-full p-4 mb-3">
                    <Ionicons
                      name="folder-open-outline"
                      size={32}
                      color="#4B5563"
                    />
                  </View>
                  <Text className="text-gray-300 text-sm font-medium">
                    {searchQuery || filterType !== "all"
                      ? "No matching files"
                      : "No attachments yet"}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1 text-center">
                    {searchQuery || filterType !== "all"
                      ? "Try adjusting your filters"
                      : "Upload files to share with your team"}
                  </Text>
                  {!searchQuery && filterType === "all" && (
                    <TouchableOpacity
                      onPress={() => setUploadModalVisible(true)}
                      className="mt-3 bg-blue-500/15 border border-blue-500/30 px-4 py-2 rounded-xl flex-row items-center"
                    >
                      <Ionicons
                        name="cloud-upload-outline"
                        size={14}
                        color="#60A5FA"
                      />
                      <Text className="text-blue-400 text-xs font-medium ml-1.5">
                        Upload First File
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>

        <AttachmentPreviewModal
          visible={previewModalVisible}
          attachment={selectedAttachment}
          onClose={() => setPreviewModalVisible(false)}
          onDelete={isOwner && !deletingAttachment ? handleDeleteAttachment : undefined}
        />

        <UploadAttachmentModal
          visible={uploadModalVisible}
          projectId={id as string}
          projectTitle={project.title}
          onClose={() => setUploadModalVisible(false)}
          onSuccess={handleUploadSuccess}
        />

        {AlertComponent}
      </SafeAreaView>
    </View>
  );
}