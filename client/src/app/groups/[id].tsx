import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
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
} from "../../services/groupService";
import { Group, GroupMember } from "../../types";
import { theme } from "../../config/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);

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
      // For now, we'll need to get user ID from email
      // This is a simplified version - in real app you'd search users
      Alert.alert(
        "Info",
        "Member addition requires user ID. This feature needs backend enhancement."
      );
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
            const updatedGroup = await removeMember(
              id as string,
              user!.id
              //   memberId
            );
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
          {/* Header */}
          <View className="pt-6 pb-4 px-6 bg-gray-900/50">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-white">{group.name}</Text>
              <View className="flex-row gap-2">
                {isAdmin() && (
                  <>
                    <TouchableOpacity onPress={openEditModal}>
                      <Ionicons name="pencil" size={24} color="#60A5FA" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setAddMemberModalVisible(true)}
                    >
                      <Ionicons name="person-add" size={24} color="#60A5FA" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>

          <ScrollView className="flex-1 px-4 py-4">
            {/* Group Info */}
            <View className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
              <Text className="text-lg font-semibold text-gray-200 mb-2">
                Group Details
              </Text>
              {group.description && (
                <Text className="text-gray-400 mb-3">{group.description}</Text>
              )}
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="person-outline" size={16} color="#9CA3AF" />
                <Text className="text-gray-400 text-sm">
                  Created by {group.createdBy.name}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                <Text className="text-gray-400 text-sm">
                  Created {formatDate(group.createdAt)}
                </Text>
              </View>
            </View>

            {/* Members */}
            <View className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
              <Text className="text-lg font-semibold text-gray-200 mb-3">
                Members ({group.members.length})
              </Text>
              {group.members.map((member) => (
                <View
                  key={member.id}
                  className="flex-row items-center justify-between py-2"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-gray-600 rounded-full items-center justify-center">
                      <Text className="text-white font-semibold">
                        {member.user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-gray-200 font-medium">
                        {member.user.name}
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        {member.user.email}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View
                      className={`px-2 py-1 rounded ${member.role === "admin" ? "bg-blue-600" : "bg-gray-600"}`}
                    >
                      <Text className="text-white text-xs">{member.role}</Text>
                    </View>
                    {isAdmin() && member.user.id !== user?.id && (
                      <TouchableOpacity
                        onPress={() =>
                          handleRemoveMember(member.user.id, member.user.name)
                        }
                        className="p-1"
                      >
                        <Ionicons
                          name="remove-circle"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Group Tasks Button */}
            <TouchableOpacity
              //   onPress={() => router.push(`/tasks/group/${group.id}`)}
              className="bg-blue-600 rounded-xl py-4 items-center mb-4"
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="list-outline" size={20} color="#fff" />
                <Text className="text-white font-bold text-lg">
                  View Group Tasks
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

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
                className="rounded-t-3xl p-6"
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
                  className="bg-blue-600 rounded-xl py-4 items-center mb-4"
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
                className="rounded-t-3xl p-6"
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
                  />
                </View>

                <View className="mb-6">
                  <Text className="text-gray-300 mb-2 font-medium">Role</Text>
                  <View className="flex-row gap-2">
                    {["member", "admin"].map((role) => (
                      <TouchableOpacity
                        key={role}
                        onPress={() =>
                          setMemberRole(role as "admin" | "member")
                        }
                        className={`px-4 py-2 rounded-lg ${
                          memberRole === role ? "bg-blue-600" : "bg-gray-800"
                        }`}
                      >
                        <Text className="text-white text-sm capitalize">
                          {role}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleAddMember}
                  className="bg-blue-600 rounded-xl py-4 items-center mb-4"
                >
                  <Text className="text-white font-bold text-lg">
                    Add Member
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Modal>
        </LinearGradient>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
