import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  Share,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";
import {
  getGroupById,
  updateGroup,
  addMember,
  removeMember,
  deleteGroup,
  createInvite,
} from "../../services/groupService";
import { getUserByEmail } from "../../services/authService";
import { Group, GroupMember } from "../../types";
import { theme } from "../../config/theme";
import { config } from "../../config/environment";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Add member form state
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"admin" | "member">("member");

  useEffect(() => {
    if (id) {
      loadGroup();
    }
  }, [id]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const result = await getGroupById(id as string);
      setGroup(result);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load group"
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    try {
      const updatedGroup = await updateGroup(id as string, {
        name: editName,
        description: editDescription || undefined,
      });
      setGroup(updatedGroup);
      Alert.alert("Success", "Group updated successfully");
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update group"
      );
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      Alert.alert("Error", "Please enter member email");
      return;
    }

    try {
      const result = await createInvite(
        id as string,
        memberEmail.trim(),
        memberRole
      );

      // Check if it's a direct member addition (user exists)
      if (result.members) {
        setGroup(result);
        setMemberEmail("");
        setMemberRole("member");
        setAddMemberModalVisible(false);
        Alert.alert("Success", "Member added successfully");
      } else {
        // It's an invite - show the invite link
        const inviteLink = `https://productivityapp.com/invite/${result.token}`;
        const shareMessage = `You've been invited to join the "${group?.name}" group! Click here to accept: ${inviteLink}`;

        Alert.alert(
          "Invite Created",
          `An invite has been created for ${memberEmail}. Share this link to invite them to join the group.`,
          [
            {
              text: "Share Invite",
              onPress: async () => {
                try {
                  await Share.share({
                    message: shareMessage,
                    url: inviteLink, // For iOS
                  });
                } catch (error) {
                  Alert.alert("Error", "Failed to share invite");
                }
              },
            },
            { text: "OK" },
          ]
        );
        setMemberEmail("");
        setMemberRole("member");
        setAddMemberModalVisible(false);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to add member"
      );
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert("Remove Member", `Remove ${memberName} from this group?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const updatedGroup = await removeMember(id as string, memberId);
            setGroup(updatedGroup);
            Alert.alert("Success", "Member removed successfully");
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "Failed to remove member"
            );
          }
        },
      },
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGroup(id as string);
              Alert.alert("Success", "Group deleted successfully");
              router.replace("/groups");
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to delete group"
              );
            }
          },
        },
      ]
    );
  };

  const openEditModal = () => {
    if (group) {
      setEditName(group.name);
      setEditDescription(group.description || "");
      setEditModalVisible(true);
    }
  };

  const isAdmin = () => {
    return (
      group?.members.some(
        (member) => member.user.id === user?.id && member.role === "admin"
      ) || false
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // NEW: Render function for member items (extracted)
  const renderMemberItem = ({ item: member }: { item: GroupMember }) => (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center">
          <Text className="text-white font-bold text-lg">
            {member.user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-200 font-medium text-base">
            {member.user.name}
          </Text>
          <Text className="text-gray-400 text-sm">{member.user.email}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <View
          className={`px-3 py-1 rounded-full ${member.role === "admin" ? "bg-blue-600" : "bg-gray-600"}`}
        >
          <Text className="text-white text-xs font-medium capitalize">
            {member.role}
          </Text>
        </View>
        {isAdmin() && member.user.id !== user?.id && (
          <TouchableOpacity
            onPress={() => handleRemoveMember(member.user.id, member.user.name)}
            className="p-2 rounded-full bg-red-500/10"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="remove-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
          <ActivityIndicator size="large" color="#60A5FA" />
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  if (!group) {
    return (
      <ProtectedRoute>
        <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
          <Text className="text-gray-400">Group not found</Text>
        </SafeAreaView>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SafeAreaView className="flex-1 bg-gray-900">
        <LinearGradient colors={theme.background.gradient} className="flex-1">
          {/* FIXED Header - Stays above FlatList */}
          <View className="pt-6 pb-4 px-6 bg-gray-900/50">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-white flex-1 text-center mr-8">
                {group.name}
              </Text>
              {isAdmin() && (
                <TouchableOpacity onPress={() => setMenuModalVisible(true)}>
                  <Ionicons
                    name="ellipsis-vertical"
                    size={24}
                    color="#60A5FA"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* NEW: Single FlatList for all scrollable content */}
          <FlatList
            data={group.members}
            keyExtractor={(item) => item.id}
            // Header: Group details + tasks button
            ListHeaderComponent={
              <View className="px-4 py-4">
                {/* Group Info */}
                <View className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
                  <Text className="text-lg font-semibold text-gray-200 mb-3">
                    Group Details
                  </Text>
                  {group.description ? (
                    <Text className="text-gray-300 mb-4 leading-5">
                      {group.description}
                    </Text>
                  ) : (
                    <Text className="text-gray-500 mb-4 italic">
                      No description provided
                    </Text>
                  )}
                  <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-8 h-8 bg-gray-600 rounded-full items-center justify-center">
                      <Ionicons
                        name="person-outline"
                        size={14}
                        color="#9CA3AF"
                      />
                    </View>
                    <View>
                      <Text className="text-gray-400 text-xs">Created by</Text>
                      <Text className="text-gray-200 text-sm font-medium">
                        {group.createdBy.name}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 bg-gray-600 rounded-full items-center justify-center">
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#9CA3AF"
                      />
                    </View>
                    <View>
                      <Text className="text-gray-400 text-xs">Created on</Text>
                      <Text className="text-gray-200 text-sm font-medium">
                        {formatDate(group.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Members Header */}
                <View className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-semibold text-gray-200">
                      Members
                    </Text>
                    <View className="bg-gray-700 px-3 py-1 rounded-full">
                      <Text className="text-gray-300 text-sm font-medium">
                        {group.members.length}
                      </Text>
                    </View>
                  </View>
                  {isAdmin() && (
                    <TouchableOpacity
                      onPress={() => {
                        setAddMemberModalVisible(true);
                      }}
                      className="mb-4 bg-blue-600 rounded-xl py-3 items-center"
                    >
                      <Text className="text-white font-medium">
                        + Add Member
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Group Tasks Button */}
                <TouchableOpacity
                  onPress={() => router.push(`/tasks/group/${group.id}`)}
                  className="bg-blue-600 rounded-xl py-4 items-center mb-4"
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="list-outline" size={20} color="#fff" />
                    <Text className="text-white font-bold text-lg">
                      View Group Tasks
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }} // For bottom nav overlap
            showsVerticalScrollIndicator={false}
            // Perf tweaks (residual nesting safety)
            nestedScrollEnabled={true}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            getItemLayout={(_, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })} // ~80px per member row
            renderItem={renderMemberItem}
            // Empty state for no members
            ListEmptyComponent={
              <View className="py-8 items-center">
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-400 text-center text-lg mt-2">
                  No members yet
                </Text>
                {isAdmin() && (
                  <TouchableOpacity
                    onPress={() => setAddMemberModalVisible(true)}
                    className="mt-4 bg-blue-600 rounded-xl py-3 px-6"
                  >
                    <Text className="text-white font-medium">
                      + Add First Member
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </LinearGradient>

        {/* Modals unchanged - overlaid, no scroll issues */}
        {/* Edit Group Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <LinearGradient
              colors={["#1F2937", "#111827"]}
              className="rounded-t-3xl p-6 w-full"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-2xl font-bold text-white">
                  Edit Group
                </Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <View className="mb-4">
                <Text className="text-gray-300 mb-2 font-medium">
                  Group Name *
                </Text>
                <TextInput
                  className="bg-gray-800 rounded-xl px-4 py-3 text-gray-200 border border-gray-700"
                  placeholder="Enter group name"
                  placeholderTextColor="#6B7280"
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                />
              </View>
              <View className="mb-6">
                <Text className="text-gray-300 mb-2 font-medium">
                  Description
                </Text>
                <TextInput
                  className="bg-gray-800 rounded-xl px-4 py-3 text-gray-200 border border-gray-700 min-h-[100px]"
                  placeholder="Enter group description"
                  placeholderTextColor="#6B7280"
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              <TouchableOpacity
                onPress={handleUpdateGroup}
                className="bg-blue-600 rounded-xl py-4 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-lg">
                  Update Group
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>

        {/* Add Member Modal */}
        <Modal
          visible={addMemberModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAddMemberModalVisible(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <LinearGradient
              colors={["#1F2937", "#111827"]}
              className="rounded-t-3xl p-6 w-full"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-2xl font-bold text-white">
                  Add Member
                </Text>
                <TouchableOpacity
                  onPress={() => setAddMemberModalVisible(false)}
                >
                  <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <View className="mb-4">
                <Text className="text-gray-300 mb-2 font-medium">
                  Member Email *
                </Text>
                <TextInput
                  className="bg-gray-800 rounded-xl px-4 py-3 text-gray-200 border border-gray-700"
                  placeholder="Enter member email"
                  placeholderTextColor="#6B7280"
                  value={memberEmail}
                  onChangeText={setMemberEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
              </View>
              <View className="mb-6">
                <Text className="text-gray-300 mb-2 font-medium">Role</Text>
                <View className="flex-row gap-2">
                  {["member", "admin"].map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setMemberRole(role as "admin" | "member")}
                      className={`px-4 py-2 rounded-lg flex-1 ${
                        memberRole === role ? "bg-blue-600" : "bg-gray-800"
                      }`}
                    >
                      <Text className="text-white text-sm capitalize text-center">
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                onPress={handleAddMember}
                className="bg-blue-600 rounded-xl py-4 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-lg">Add Member</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>

        {/* Menu Modal */}
        <Modal
          visible={menuModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setMenuModalVisible(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setMenuModalVisible(false)}
          >
            <View className="bg-gray-800 rounded-t-3xl p-6 w-full">
              <Text className="text-xl font-bold text-white mb-4 text-center">
                Group Options
              </Text>
              <View className="gap-2">
                <TouchableOpacity
                  onPress={() => {
                    setMenuModalVisible(false);
                    openEditModal();
                  }}
                  className="flex-row items-center gap-3 py-3 px-4 bg-gray-700 rounded-xl"
                >
                  <Ionicons name="pencil" size={20} color="#60A5FA" />
                  <Text className="text-white font-medium">Edit Group</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setMenuModalVisible(false);
                    setAddMemberModalVisible(true);
                  }}
                  className="flex-row items-center gap-3 py-3 px-4 bg-gray-700 rounded-xl"
                >
                  <Ionicons name="person-add" size={20} color="#60A5FA" />
                  <Text className="text-white font-medium">Invite Members</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setMenuModalVisible(false);
                    handleDeleteGroup();
                  }}
                  className="flex-row items-center gap-3 py-3 px-4 bg-red-900/20 rounded-xl border border-red-500/30"
                >
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <Text className="text-red-400 font-medium">Delete Group</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setMenuModalVisible(false)}
                className="mt-4 py-3 bg-gray-600 rounded-xl items-center"
              >
                <Text className="text-white font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
