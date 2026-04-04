import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import {
  getProjectById,
  removeProjectMember,
  Project,
} from "@/src/services/projectService";
import { useAuth } from "@/src/contexts/AuthContext";
import AddMembersModal from "@/src/components/UI/modals/AddMembersModal";
import CustomAlert from "@/src/components/UI/CustomAlert";
import { resolveFileUrl } from "@/src/utils/url";

// ─── Types ─────────────────────────────────────────────────────────
interface MemberUser {
  id: string;
  name?: string;
  email?: string;
  profileImage?: string;
  avatarUrl?: string;
}

interface ProjectMember {
  id: string;
  userId?: string;
  role?: string;
  user?: MemberUser;
  name?: string;
  email?: string;
  profileImage?: string;
  avatarUrl?: string;
}

type MemberRoleFilter = "all" | "owner" | "admin" | "member";

// ─── Avatar Component ──────────────────────────────────────────────
function MemberAvatar({
  name,
  imageUrl,
  size = 44,
  isOwner = false,
}: {
  name?: string;
  imageUrl?: string;
  size?: number;
  isOwner?: boolean;
}) {
  const getInitials = (n?: string) => {
    if (!n) return "?";
    const parts = n.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  const getColor = (n?: string) => {
    if (!n) return "#6B7280";
    const colors = [
      "#60A5FA",
      "#34D399",
      "#F472B6",
      "#A78BFA",
      "#FBBF24",
      "#F87171",
      "#2DD4BF",
      "#FB923C",
    ];
    const index = n
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const color = getColor(name);

  return (
    <View style={{ position: "relative" }}>
      {imageUrl ? (
        <Image
          source={{ uri: resolveFileUrl(imageUrl) }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: isOwner ? 2 : 0,
            borderColor: isOwner ? "#FBBF24" : "transparent",
          }}
          className="bg-gray-700"
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: `${color}20`,
            borderWidth: isOwner ? 2 : 1,
            borderColor: isOwner ? "#FBBF24" : `${color}40`,
          }}
          className="items-center justify-center"
        >
          <Text
            style={{
              color: color,
              fontSize: size * 0.36,
              fontWeight: "700",
            }}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}

      {/* Owner crown indicator */}
      {isOwner && (
        <View
          className="absolute -top-1 -right-1 bg-amber-500 rounded-full items-center justify-center"
          style={{ width: 18, height: 18 }}
        >
          <Ionicons name="star" size={10} color="#fff" />
        </View>
      )}
    </View>
  );
}

// ─── Role Badge ────────────────────────────────────────────────────
function RoleBadge({
  role,
  isOwner,
}: {
  role?: string;
  isOwner: boolean;
}) {
  if (isOwner) {
    return (
      <View className="bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg">
        <Text className="text-amber-400 text-xs font-semibold">Owner</Text>
      </View>
    );
  }

  if (role === "admin") {
    return (
      <View className="bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 rounded-lg">
        <Text className="text-purple-400 text-xs font-semibold">Admin</Text>
      </View>
    );
  }

  return (
    <View className="bg-gray-700/40 border border-gray-600/30 px-2.5 py-1 rounded-lg">
      <Text className="text-gray-400 text-xs font-medium">Member</Text>
    </View>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────
function SkeletonMemberCard({ index }: { index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(300)}
      className="flex-row items-center p-4 bg-gray-800/60 rounded-2xl mb-3 border border-gray-700/30"
    >
      <View className="w-11 h-11 rounded-full bg-gray-700 animate-pulse" />
      <View className="ml-3 flex-1">
        <View className="w-32 h-4 bg-gray-700 rounded-lg animate-pulse" />
        <View className="w-48 h-3 bg-gray-700 rounded-lg animate-pulse mt-2" />
      </View>
      <View className="w-16 h-6 bg-gray-700 rounded-lg animate-pulse" />
    </Animated.View>
  );
}

// ─── Empty State ───────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd?: () => void }) {
  return (
    <View className="flex-1 justify-center items-center px-8 py-20">
      <View className="bg-gray-800/40 rounded-full p-6 mb-4">
        <View className="bg-gray-700/40 rounded-full p-4">
          <Ionicons name="people-outline" size={40} color="#4B5563" />
        </View>
      </View>
      <Text className="text-white text-lg font-bold text-center">
        No Members Yet
      </Text>
      <Text className="text-gray-400 text-sm text-center mt-2 leading-5">
        Start building your team by adding{"\n"}members to this project.
      </Text>
      {onAdd && (
        <TouchableOpacity
          onPress={onAdd}
          className="mt-6 bg-blue-500/15 border border-blue-500/30 px-5 py-3 rounded-2xl flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="person-add-outline" size={18} color="#60A5FA" />
          <Text className="text-blue-400 font-semibold ml-2">
            Add First Member
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function ProjectMembers() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<MemberRoleFilter>("all");

  // Alert states
  const [removeAlertVisible, setRemoveAlertVisible] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProjectById(id as string);
      setProject(data);
    } catch (err) {
      Alert.alert("Error", "Failed to load project members");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) loadProject();
  }, [id, loadProject]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProject();
    setRefreshing(false);
  }, [loadProject]);

  const isOwner = project?.ownerId === user?.id;
  const members: ProjectMember[] = useMemo(() => {
    const rawMembers: ProjectMember[] = project?.members || [];
    const ownerUser = project?.owner;

    const ownerMember: ProjectMember | null = ownerUser
      ? {
          id: ownerUser.id,
          userId: ownerUser.id,
          role: "owner",
          user: {
            id: ownerUser.id,
            name: ownerUser.name,
            email: ownerUser.email,
            profileImage: ownerUser.profileImage,
          },
        }
      : null;

    const combined = ownerMember ? [ownerMember, ...rawMembers] : rawMembers;
    const seen = new Set<string>();

    return combined.filter((member) => {
      const memberUser = member.user || member;
      const memberId = memberUser.id || member.userId || member.id;
      if (!memberId || seen.has(memberId)) return false;
      seen.add(memberId);
      return true;
    });
  }, [project?.members, project?.owner]);

  const existingMemberIds = useMemo(
    () =>
      members
        .map((m) => {
          const memberUser = m.user || m;
          return memberUser.id || m.userId || m.id;
        })
        .filter(Boolean) as string[],
    [members]
  );

  const roleStats = useMemo(() => {
    const ownerCount = members.some((m) => (m.user || m).id === project?.ownerId)
      ? 1
      : 0;
    const adminsCount = members.filter(
      (m) => m.role === "admin" && (m.user || m).id !== project?.ownerId
    ).length;
    const membersCount = members.filter(
      (m) => m.role !== "admin" && (m.user || m).id !== project?.ownerId
    ).length;

    return { ownerCount, adminsCount, membersCount };
  }, [members, project?.ownerId]);

  // Search / role filter
  const filteredMembers = useMemo(() => {
    const roleFiltered = members.filter((item) => {
      const memberUser = item.user || item;
      const isOwnerMember = memberUser.id === project?.ownerId;

      if (selectedRoleFilter === "all") return true;
      if (selectedRoleFilter === "owner") return isOwnerMember;
      if (selectedRoleFilter === "admin") return !isOwnerMember && item.role === "admin";
      return !isOwnerMember && item.role !== "admin";
    });

    if (!searchQuery.trim()) return roleFiltered;

    const q = searchQuery.toLowerCase();
    return roleFiltered.filter((item) => {
      const memberUser = item.user || item;
      const name = (
        memberUser.name ||
        memberUser.email ||
        ""
      ).toLowerCase();
      const email = (memberUser.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [members, project?.ownerId, searchQuery, selectedRoleFilter]);

  // Sort: owner first, then admins, then members
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const aUser = a.user || a;
      const bUser = b.user || b;
      const aIsOwner = project?.ownerId === aUser.id;
      const bIsOwner = project?.ownerId === bUser.id;

      if (aIsOwner && !bIsOwner) return -1;
      if (!aIsOwner && bIsOwner) return 1;
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (a.role !== "admin" && b.role === "admin") return 1;
      return 0;
    });
  }, [filteredMembers, project?.ownerId]);

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setRemoveAlertVisible(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      setRemovingId(memberToRemove.id);
      setRemoveAlertVisible(false);
      const updatedProject = await removeProjectMember(
        id as string,
        memberToRemove.id
      );
      setProject(updatedProject);
      setSuccessAlertVisible(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to remove member"
      );
      setErrorAlertVisible(true);
    } finally {
      setRemovingId(null);
      setMemberToRemove(null);
    }
  };

  // ─── Member Card Renderer ─────────────────────────────────────
  const renderMember = ({
    item,
    index,
  }: {
    item: ProjectMember;
    index: number;
  }) => {
    const memberUser: MemberUser = (item.user || item) as MemberUser;
    const memberIsOwner = project?.ownerId === memberUser.id;
    const isCurrentUser = user?.id === memberUser.id;
    const canRemove = isOwner && !memberIsOwner;
    const imageUrl = memberUser.profileImage || memberUser.avatarUrl;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 60)
          .duration(350)}
        exiting={FadeOut.duration(200)}
        layout={Layout.springify().damping(18)}
      >
        <View
          className={`flex-row items-center p-4 rounded-2xl mb-3 border ${
            memberIsOwner
              ? "bg-amber-500/5 border-amber-500/20"
              : "bg-gray-800/60 border-gray-700/40"
          }`}
        >
          {/* Avatar */}
          <MemberAvatar
            name={memberUser.name}
            imageUrl={imageUrl}
            size={44}
            isOwner={memberIsOwner}
          />

          {/* Info */}
          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text
                className="text-white font-semibold text-base flex-shrink"
                numberOfLines={1}
              >
                {memberUser.name || "Unknown"}
              </Text>
              {isCurrentUser && (
                <View className="bg-blue-500/15 px-1.5 py-0.5 rounded-md ml-2">
                  <Text className="text-blue-400 text-[10px] font-bold">
                    YOU
                  </Text>
                </View>
              )}
            </View>
            <Text
              className="text-gray-400 text-xs mt-0.5"
              numberOfLines={1}
            >
              {memberUser.email || "No email"}
            </Text>
          </View>

          {/* Role + Actions */}
          <View className="flex-row items-center gap-2">
            <RoleBadge role={item.role} isOwner={memberIsOwner} />

            {canRemove && (
              <TouchableOpacity
                onPress={() =>
                  handleRemoveMember(
                    memberUser.id,
                    memberUser.name || "this member"
                  )
                }
                disabled={removingId === memberUser.id}
                className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl"
                activeOpacity={0.6}
              >
                {removingId === memberUser.id ? (
                  <ActivityIndicator size={16} color="#F87171" />
                ) : (
                  <Ionicons
                    name="person-remove-outline"
                    size={16}
                    color="#F87171"
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  // ─── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="px-5 pt-6 pb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View className="px-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonMemberCard key={i} index={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.duration(350)}>
          <View className="px-5 pt-4">
            {/* Top row */}
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-gray-800/60 rounded-xl p-2"
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>

              {isOwner && (
                <TouchableOpacity
                  onPress={() => setAddModalVisible(true)}
                  className="bg-blue-500/15 border border-blue-500/30 rounded-xl px-4 py-2 flex-row items-center"
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={16}
                    color="#60A5FA"
                  />
                  <Text className="text-blue-400 font-semibold text-sm ml-1.5">
                    Add
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Title + count */}
            <View className="mt-4">
              <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                {project?.title || "Project"}
              </Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-white text-2xl font-bold">Members</Text>
                <View className="bg-gray-700/60 rounded-full px-2.5 py-0.5 ml-3">
                  <Text className="text-gray-300 text-sm font-semibold">
                    {members.length}
                  </Text>
                </View>
              </View>
            </View>

            {/* Search bar */}
            {members.length > 3 && (
              <View
                className={`flex-row items-center mt-4 rounded-xl px-3 py-2.5 border ${
                  searchFocused
                    ? "bg-gray-800/80 border-blue-500/40"
                    : "bg-gray-800/50 border-gray-700/40"
                }`}
              >
                <Ionicons
                  name="search-outline"
                  size={16}
                  color={searchFocused ? "#60A5FA" : "#6B7280"}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search members..."
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
            )}
          </View>
      </Animated.View>

      {/* ─── Role Summary Strip ──────────────────────────────────── */}
      {members.length > 0 && (
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          className="px-5 pb-3"
        >
          <View className="flex-row gap-2">
            {[
              {
                key: "all" as MemberRoleFilter,
                label: "All",
                count: members.length,
                color: "#9CA3AF",
                bg: "bg-gray-500/10",
              },
              {
                key: "owner" as MemberRoleFilter,
                label: "Owner",
                count: roleStats.ownerCount,
                color: "#FBBF24",
                bg: "bg-amber-500/10",
              },
              {
                key: "admin" as MemberRoleFilter,
                label: "Admins",
                count: roleStats.adminsCount,
                color: "#A78BFA",
                bg: "bg-purple-500/10",
              },
              {
                key: "member" as MemberRoleFilter,
                label: "Members",
                count: roleStats.membersCount,
                color: "#60A5FA",
                bg: "bg-blue-500/10",
              },
            ]
              .filter((s) => s.count > 0)
              .map((stat) => (
                <TouchableOpacity
                  key={stat.label}
                  onPress={() => setSelectedRoleFilter(stat.key)}
                  activeOpacity={0.7}
                  className={`${stat.bg} rounded-xl px-3 py-2 flex-row items-center border ${
                    selectedRoleFilter === stat.key
                      ? "border-white/25"
                      : "border-transparent"
                  }`}
                >
                  <View
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: stat.color }}
                  />
                  <Text
                    className="text-xs font-medium"
                    style={{ color: stat.color }}
                  >
                    {stat.count} {stat.label}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </Animated.View>
      )}

      {/* ─── Member List ─────────────────────────────────────────── */}
      <FlatList
        data={sortedMembers}
        keyExtractor={(item) => item.id || item.userId || Math.random().toString()}
        renderItem={renderMember}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#60A5FA"
            colors={["#60A5FA"]}
          />
        }
        ListEmptyComponent={
          searchQuery ? (
            <View className="items-center py-16">
              <View className="bg-gray-800/40 rounded-full p-4 mb-3">
                <Ionicons
                  name="search-outline"
                  size={28}
                  color="#4B5563"
                />
              </View>
              <Text className="text-gray-300 text-base font-semibold">
                No results found
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                No members match "{searchQuery}"
              </Text>
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                className="mt-4 bg-gray-800/50 px-4 py-2 rounded-xl"
              >
                <Text className="text-blue-400 text-sm font-medium">
                  Clear Search
                </Text>
              </TouchableOpacity>
            </View>
          ) : selectedRoleFilter !== "all" ? (
            <View className="items-center py-16">
              <View className="bg-gray-800/40 rounded-full p-4 mb-3">
                <Ionicons
                  name="funnel-outline"
                  size={28}
                  color="#4B5563"
                />
              </View>
              <Text className="text-gray-300 text-base font-semibold">
                No {selectedRoleFilter === "member" ? "members" : `${selectedRoleFilter}s`} found
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedRoleFilter("all")}
                className="mt-4 bg-gray-800/50 px-4 py-2 rounded-xl"
              >
                <Text className="text-blue-400 text-sm font-medium">
                  Show All
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <EmptyState
              onAdd={isOwner ? () => setAddModalVisible(true) : undefined}
            />
          )
        }
      />

      {/* ─── Modals ──────────────────────────────────────────────── */}
      <AddMembersModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        projectId={id as string}
        onSuccess={() => loadProject()}
        existingMemberIds={existingMemberIds}
        projectOwnerId={project?.ownerId}
      />

      {/* ─── Themed Alerts ───────────────────────────────────────── */}
      <CustomAlert
        visible={removeAlertVisible}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.name}?\n\nThey will lose access to this project.`}
        type="warning"
        showCancel
        cancelText="Cancel"
        confirmText="Remove"
        onClose={() => {
          setRemoveAlertVisible(false);
          setMemberToRemove(null);
        }}
        onConfirm={confirmRemoveMember}
      />

      <CustomAlert
        visible={successAlertVisible}
        title="Member Removed"
        message="The member has been removed from this project."
        type="success"
        confirmText="OK"
        onClose={() => setSuccessAlertVisible(false)}
        onConfirm={() => setSuccessAlertVisible(false)}
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