import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useAuth } from "../../contexts/AuthContext";
import {
  getProjectById,
  deleteProject,
  Project,
} from "../../services/projectService";
import {
  getProjectAttachments,
  Attachment,
} from "../../services/attachmentService";
import ProjectTasksList from "../../components/ProjectTasksList";
import AddMembersModal from "../../components/UI/modals/AddMembersModal";
import InviteMemberModal from "../../components/UI/modals/InviteMemberModal";
import AttachmentGrid from "../../components/UI/AttachmentGrid";
import AttachmentPreviewModal from "../../components/UI/modals/AttachmentPreviewModal";
import UploadAttachmentModal from "../../components/UI/modals/UploadAttachmentModal";
import ActivitySection from "../../components/ActivitySection";
import ProjectStatusReport from "../../components/ProjectStatusReport";
import CustomAlert from "../../components/UI/CustomAlert";
import { Button } from "@/src/components/UI/Buttons";
import { resolveFileUrl } from "@/src/utils/url";

interface ProjectMember {
  id: string;
  userId?: string;
  name?: string;
  fullName?: string;
  username?: string;
  avatarUrl?: string;
}

interface ProjectData extends Project {
  tasks?: any[];
  members?: ProjectMember[];
}

// ─── Skeleton Loader ───────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <View className="px-4 py-4">
      {/* Header skeleton */}
      <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700/50 mb-4">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-xl bg-gray-700 animate-pulse" />
          <View className="flex-1 ml-3">
            <View className="w-3/4 h-5 bg-gray-700 rounded-lg animate-pulse" />
            <View className="w-1/2 h-3 bg-gray-700 rounded-lg animate-pulse mt-2" />
          </View>
        </View>
      </View>

      {/* Stats skeleton */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700/50">
          <View className="w-16 h-4 bg-gray-700 rounded animate-pulse" />
          <View className="w-10 h-6 bg-gray-700 rounded animate-pulse mt-2" />
        </View>
        <View className="flex-1 bg-gray-800 rounded-xl p-4 border border-gray-700/50">
          <View className="w-16 h-4 bg-gray-700 rounded animate-pulse" />
          <View className="w-10 h-6 bg-gray-700 rounded animate-pulse mt-2" />
        </View>
      </View>

      {/* Content skeleton */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="bg-gray-800 rounded-xl p-4 border border-gray-700/50 mb-3"
        >
          <View className="w-full h-4 bg-gray-700 rounded animate-pulse" />
          <View className="w-2/3 h-3 bg-gray-700 rounded animate-pulse mt-2" />
        </View>
      ))}
    </View>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  onPress,
  suffix,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  color: string;
  onPress?: () => void;
  suffix?: string;
  index: number;
}) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(400)}
      className="flex-1"
    >
      <Container
        onPress={onPress}
        activeOpacity={0.7}
        className="bg-gray-800/80 rounded-2xl border border-gray-700/50 p-4"
      >
        <View className="flex-row items-center justify-between">
          <View
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Ionicons name={icon} size={18} color={color} />
          </View>
          {onPress && (
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          )}
        </View>
        <Text className="text-2xl font-bold text-white mt-3">
          {value}
          {suffix && (
            <Text className="text-sm font-normal text-gray-400">
              {" "}
              {suffix}
            </Text>
          )}
        </Text>
        <Text className="text-gray-400 text-xs mt-0.5">{label}</Text>
      </Container>
    </Animated.View>
  );
}

// ─── Avatar Group ──────────────────────────────────────────────────
function AvatarGroup({
  members,
  maxVisible = 4,
}: {
  members: ProjectMember[];
  maxVisible?: number;
}) {
  const visible = members.slice(0, maxVisible);
  const extra = members.length - visible.length;

  const getInitials = (member: ProjectMember) => {
    const name = member.name || member.fullName || member.username || "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  const getColor = (name?: string) => {
    if (!name) return "#6B7280";
    const colors = [
      "#60A5FA",
      "#34D399",
      "#F472B6",
      "#A78BFA",
      "#FBBF24",
      "#F87171",
    ];
    const index = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <View className="flex-row items-center">
      {visible.map((member, index) => {
        const name =
          member.name || member.fullName || member.username || "User";
        return (
          <View
            key={member.id ?? index}
            style={{
              marginLeft: index === 0 ? 0 : -10,
              zIndex: visible.length - index,
            }}
          >
            {member.avatarUrl ? (
              <Image
                source={{ uri: resolveFileUrl(member.avatarUrl) }}
                className="w-8 h-8 rounded-full border-2 border-gray-900"
              />
            ) : (
              <View
                className="w-8 h-8 rounded-full border-2 border-gray-900 items-center justify-center"
                style={{ backgroundColor: `${getColor(name)}30` }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: getColor(name) }}
                >
                  {getInitials(member)}
                </Text>
              </View>
            )}
          </View>
        );
      })}
      {extra > 0 && (
        <View
          className="w-8 h-8 rounded-full bg-gray-700/80 border-2 border-gray-900 items-center justify-center"
          style={{ marginLeft: -10 }}
        >
          <Text className="text-xs text-gray-300 font-semibold">
            +{extra}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Section Header ────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  count,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center">
        <Ionicons name={icon} size={18} color="#60A5FA" />
        <Text className="text-white font-semibold text-base ml-2">
          {title}
        </Text>
        {count !== undefined && (
          <View className="bg-gray-700/60 rounded-full px-2 py-0.5 ml-2">
            <Text className="text-gray-300 text-xs font-medium">{count}</Text>
          </View>
        )}
      </View>
      {action}
    </View>
  );
}

// ─── Menu Item ─────────────────────────────────────────────────────
function MenuItem({
  icon,
  label,
  onPress,
  destructive = false,
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      className={`flex-row items-center p-3 rounded-xl ${
        destructive ? "active:bg-red-900/20" : "active:bg-gray-700/60"
      }`}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <View
        className="w-8 h-8 rounded-lg items-center justify-center"
        style={{
          backgroundColor: destructive
            ? "rgba(239,68,68,0.12)"
            : "rgba(96,165,250,0.12)",
        }}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? "#EF4444" : "#60A5FA"}
        />
      </View>
      <Text
        className={`ml-3 font-medium ${
          destructive ? "text-red-400" : "text-white"
        }`}
      >
        {label}
      </Text>
      {!destructive && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color="#4B5563"
          style={{ marginLeft: "auto" }}
        />
      )}
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function ProjectDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasks">(
    "dashboard"
  );
  const [addMembersModalVisible, setAddMembersModalVisible] = useState(false);
  const [inviteEmailModalVisible, setInviteEmailModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Delete confirmation alert state
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Attachments state
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

  const loadProjectDetail = useCallback(
    async (projectId: string) => {
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
    },
    [router]
  );

  useEffect(() => {
    if (id && typeof id === "string") {
      loadProjectDetail(id);
      loadAttachments(id);
    }
  }, [id, loadProjectDetail, loadAttachments]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    if (!id || typeof id !== "string") return;
    setRefreshing(true);
    await Promise.all([loadProjectDetail(id), loadAttachments(id)]);
    setRefreshing(false);
  }, [id, loadProjectDetail, loadAttachments]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOwner = project?.ownerId === user?.id;
  const taskCount = project?.tasks?.length || 0;
  const memberCount = project?.members?.length || 0;
  const members = project?.members || [];

  const existingMemberIds = useMemo(
    () => members.map((m) => m.userId || m.id),
    [members]
  );

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
    )
      return "document";
    return "other";
  };

  const filteredAttachments = useMemo(() => {
    return attachments.filter((attachment) => {
      if (
        filterType !== "all" &&
        getAttachmentType(attachment.fileType) !== filterType
      )
        return false;
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

  const handleUploadSuccess = () => {
    if (id && typeof id === "string") loadAttachments(id);
  };

  const handleDeleteProject = () => {
    setMenuVisible(false);
    // Small delay so menu closes visually before alert appears
    setTimeout(() => setDeleteAlertVisible(true), 200);
  };

  const confirmDeleteProject = async () => {
    try {
      setDeleting(true);
      await deleteProject(id as string);
      setDeleteAlertVisible(false);
      setSuccessAlertVisible(true);
    } catch (err) {
      setDeleteAlertVisible(false);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to delete project"
      );
      setErrorAlertVisible(true);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSuccess = () => {
    setSuccessAlertVisible(false);
    router.back();
  };

  // ─── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950">
        <View className="pt-6 pb-4 px-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <SkeletonLoader />
      </SafeAreaView>
    );
  }

  // ─── Not Found ─────────────────────────────────────────────────
  if (!project) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-red-500/10 rounded-full p-6 mb-4">
            <Ionicons name="alert-circle-outline" size={48} color="#F87171" />
          </View>
          <Text className="text-white text-xl font-bold">
            Project Not Found
          </Text>
          <Text className="text-gray-400 text-sm text-center mt-2">
            This project may have been deleted or you don't have access.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="primary"
            className="mt-8"
          />
        </View>
      </SafeAreaView>
    );
  }

  const tabs = [
    { key: "dashboard" as const, label: "Dashboard", icon: "grid-outline" as const },
    { key: "tasks" as const, label: "Tasks", icon: "checkbox-outline" as const, count: taskCount },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.duration(350)}>
        <LinearGradient
          colors={["rgba(30,41,59,0.8)", "rgba(3,7,18,0)"]}
          className="pb-2"
        >
          <View className="px-5 pt-4 pb-2">
            {/* Top row */}
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-gray-800/60 rounded-xl p-2"
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                className="bg-gray-800/60 rounded-xl p-2"
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            {/* Project identity */}
            <View className="mt-4 flex-row items-center">
              <View className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 items-center justify-center mr-3">
                <Ionicons name="folder-outline" size={22} color="#60A5FA" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-white text-xl font-bold"
                  numberOfLines={1}
                >
                  {project.title}
                </Text>
                {project.description ? (
                  <Text
                    className="text-gray-400 text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {project.description}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Date + role badge */}
            <View className="flex-row items-center mt-3 gap-3">
              <View className="flex-row items-center">
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color="#6B7280"
                />
                <Text className="text-gray-500 text-xs ml-1.5">
                  Created {formatDate(project.createdAt)}
                </Text>
              </View>
              {isOwner && (
                <View className="bg-amber-500/15 px-2 py-0.5 rounded-md">
                  <Text className="text-amber-400 text-xs font-medium">
                    Owner
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ─── Stat Cards ──────────────────────────────────────────── */}
      <View className="px-4 flex-row gap-3 mb-2 mt-1">
        <StatCard
          icon="people-outline"
          label="Members"
          value={memberCount}
          color="#60A5FA"
          index={0}
          onPress={() => router.push(`/projects/${id}/members`)}
        />
        <StatCard
          icon="checkbox-outline"
          label="Tasks"
          value={taskCount}
          color="#34D399"
          index={1}
          onPress={() => setActiveTab("tasks")}
        />
        <StatCard
          icon="attach-outline"
          label="Files"
          value={attachments.length}
          color="#A78BFA"
          index={2}
        />
      </View>

      {/* ─── Member Avatars Row ──────────────────────────────────── */}
      {members.length > 0 && (
        <Animated.View entering={FadeInDown.delay(200).duration(350)}>
          <TouchableOpacity
            onPress={() => router.push(`/projects/${id}/members`)}
            activeOpacity={0.7}
            className="px-4 py-3 flex-row items-center justify-between"
          >
            <AvatarGroup members={members} maxVisible={6} />
            <View className="flex-row items-center">
              <Text className="text-gray-400 text-xs mr-1">View all</Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color="#6B7280"
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ─── Tab Bar ─────────────────────────────────────────────── */}
      <View className="px-4 mb-2">
        <View className="flex-row bg-gray-800/60 rounded-2xl p-1 border border-gray-700/40">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
                activeTab === tab.key ? "bg-gray-700/80" : ""
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? "#fff" : "#6B7280"}
              />
              <Text
                className={`ml-2 font-medium text-sm ${
                  activeTab === tab.key ? "text-white" : "text-gray-500"
                }`}
              >
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View
                  className={`ml-1.5 px-1.5 py-0.5 rounded-md ${
                    activeTab === tab.key
                      ? "bg-blue-500/25"
                      : "bg-gray-700/50"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      activeTab === tab.key
                        ? "text-blue-400"
                        : "text-gray-500"
                    }`}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ─── Scrollable Content ──────────────────────────────────── */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#60A5FA"
            colors={["#60A5FA"]}
          />
        }
      >
        {/* ── Dashboard Tab ─────────────────────────────────────── */}
        {activeTab === "dashboard" && (
          <View>
            {/* Status Report */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              className="mb-4"
            >
              <ProjectStatusReport projectId={id as string} />
            </Animated.View>

            {/* Activity */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              className="mb-4"
            >
              <ActivitySection projectId={id as string} />
            </Animated.View>

            {/* Attachments */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
            >
              <View className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/40">
                <SectionHeader
                  icon="attach-outline"
                  title="Attachments"
                  count={filteredAttachments.length}
                  action={
                    <TouchableOpacity
                      onPress={() => setUploadModalVisible(true)}
                      className="bg-blue-500/15 border border-blue-500/30 rounded-xl px-3 py-1.5 flex-row items-center"
                    >
                      <Ionicons name="cloud-upload-outline" size={14} color="#60A5FA" />
                      <Text className="text-blue-400 text-xs font-medium ml-1.5">
                        Upload
                      </Text>
                    </TouchableOpacity>
                  }
                />

                {/* Filter chips */}
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
                        className={`px-3 py-1.5 rounded-xl border ${
                          filterType === type
                            ? "bg-blue-500/15 border-blue-500/30"
                            : "bg-gray-700/30 border-gray-700/50"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            filterType === type
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

                {/* Search */}
                <View className="flex-row items-center bg-gray-900/60 rounded-xl px-3 py-2.5 mb-3 border border-gray-700/30">
                  <Ionicons
                    name="search-outline"
                    size={16}
                    color="#6B7280"
                  />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search files..."
                    placeholderTextColor="#4B5563"
                    className="flex-1 ml-2 text-white text-sm"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Content */}
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
          </View>
        )}

        {/* ── Tasks Tab ─────────────────────────────────────────── */}
        {activeTab === "tasks" && id && typeof id === "string" && (
          <Animated.View entering={FadeInDown.duration(350)}>
            <ProjectTasksList projectId={id} />
          </Animated.View>
        )}
      </ScrollView>

      {/* ─── Menu Modal ──────────────────────────────────────────── */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            className="absolute top-0 right-0 left-0 bottom-0 justify-end"
            pointerEvents="box-none"
          >
            <TouchableOpacity activeOpacity={1}>
              <View className="bg-gray-800 rounded-t-3xl border-t border-gray-700/50 px-4 pt-3 pb-8">
                {/* Drag handle */}
                <View className="w-10 h-1 bg-gray-600 rounded-full self-center mb-4" />

                <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider px-3 mb-2">
                  Project Actions
                </Text>

                <MenuItem
                  icon="person-add-outline"
                  label="Add Members"
                  onPress={() => {
                    setMenuVisible(false);
                    setAddMembersModalVisible(true);
                  }}
                />
                <MenuItem
                  icon="mail-outline"
                  label="Invite via Email"
                  onPress={() => {
                    setMenuVisible(false);
                    setInviteEmailModalVisible(true);
                  }}
                />

                {isOwner && (
                  <>
                    <View className="h-px bg-gray-700/50 my-2 mx-3" />
                    <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider px-3 mb-2 mt-1">
                      Management
                    </Text>

                    <MenuItem
                      icon="list-outline"
                      label="Manage Statuses"
                      onPress={() => {
                        setMenuVisible(false);
                        router.push(`/projects/${id}/statuses`);
                      }}
                    />
                    <MenuItem
                      icon="flag-outline"
                      label="Manage Priorities"
                      onPress={() => {
                        setMenuVisible(false);
                        router.push(`/projects/${id}/priorities`);
                      }}
                    />
                    <MenuItem
                      icon="document-text-outline"
                      label="Assignment Report"
                      onPress={() => {
                        setMenuVisible(false);
                        router.push(`/projects/${id}/assignment-report`);
                      }}
                    />
                  </>
                )}

                <View className="h-px bg-gray-700/50 my-2 mx-3" />

                <MenuItem
                  icon="trash-outline"
                  label={deleting ? "Deleting..." : "Delete Project"}
                  onPress={handleDeleteProject}
                  destructive
                  disabled={deleting}
                />
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Modals ──────────────────────────────────────────────── */}
      <AddMembersModal
        visible={addMembersModalVisible}
        onClose={() => setAddMembersModalVisible(false)}
        projectId={id as string}
        onSuccess={() => loadProjectDetail(id as string)}
        existingMemberIds={existingMemberIds}
        projectOwnerId={project?.ownerId}
      />

      <InviteMemberModal
        visible={inviteEmailModalVisible}
        onClose={() => setInviteEmailModalVisible(false)}
        projectId={id as string}
        onSuccess={() => loadProjectDetail(id as string)}
      />

      <AttachmentPreviewModal
        visible={previewModalVisible}
        attachment={selectedAttachment}
        onClose={() => setPreviewModalVisible(false)}
      />

      <UploadAttachmentModal
        visible={uploadModalVisible}
        projectId={id as string}
        projectTitle={project?.title || "Project"}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* ─── Alerts ──────────────────────────────────────────────── */}
      <CustomAlert
        visible={deleteAlertVisible}
        title="Delete Project"
        message={`Are you sure you want to delete "${project?.title}"?\n\nThis action cannot be undone.`}
        type="warning"
        showCancel
        cancelText="Cancel"
        confirmText="Delete"
        onClose={() => setDeleteAlertVisible(false)}
        onConfirm={confirmDeleteProject}
      />
      <CustomAlert
        visible={successAlertVisible}
        title="Success"
        message="Project has been deleted successfully."
        type="success"
        confirmText="OK"
        onClose={handleDeleteSuccess}
        onConfirm={handleDeleteSuccess}
      />
      <CustomAlert
        visible={errorAlertVisible}
        title="Error"
        message={errorMessage}
        type="error"
        confirmText="OK"
        onClose={() => setErrorAlertVisible(false)}
        onConfirm={() => setErrorAlertVisible(false)}
      />
    </SafeAreaView>
  );
}