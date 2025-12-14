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
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllGroups,
  createGroup,
  deleteGroup,
} from "../../services/groupService";
import { Group } from "../../types";
import { theme } from "../../config/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const result = await getAllGroups();
      setGroups(result);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load groups"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    try {
      await createGroup({
        name,
        description: description || undefined,
      });
      Alert.alert("Success", "Group created successfully");
      resetForm();
      setModalVisible(false);
      loadGroups();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create group"
      );
    }
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${groupName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGroup(groupId);
              Alert.alert("Success", "Group deleted successfully");
              loadGroups();
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

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    // <ProtectedRoute>
    <SafeAreaView className="flex-1 bg-gray-900">
      <LinearGradient colors={theme.background.gradient} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View className="pt-6 pb-4 px-6 bg-gray-900/50">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-white">My Groups</Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setModalVisible(true);
                }}
              >
                <Ionicons name="add-circle" size={28} color="#60A5FA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Groups List */}
          {loading ? (
            <View className="flex-1 justify-center items-center ">
              <ActivityIndicator size="large" color="#60A5FA" />
            </View>
          ) : (
            <FlatList
              data={groups}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 100, padding: 16 }}
              renderItem={({ item: group }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/groups/${group.id}` as any)}
                  className="bg-gray-800 rounded-xl p-4 mb-3 border border-gray-700 active:bg-gray-750"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-200 mb-1">
                        {group.name}
                      </Text>
                      {group.description && (
                        <Text className="text-gray-400 text-sm mb-2">
                          {group.description}
                        </Text>
                      )}
                      <View className="flex-row items-center gap-2">
                        <Ionicons
                          name="people-outline"
                          size={16}
                          color="#9CA3AF"
                        />
                        <Text className="text-gray-400 text-sm">
                          {group.members.length} members
                        </Text>
                        <Text className="text-gray-500 text-sm">•</Text>
                        <Text className="text-gray-400 text-sm">
                          Created {formatDate(group.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id, group.name);
                        }}
                        className="p-2"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Create Group Modal */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
              setModalVisible(false);
              resetForm();
            }}
          >
            <View className="flex-1 justify-end bg-black/50">
              <LinearGradient
                colors={["#1F2937", "#111827"]}
                className="rounded-t-3xl p-6"
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-2xl font-bold text-white">
                    New Group
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
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
                    value={name}
                    onChangeText={setName}
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
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  onPress={handleCreateGroup}
                  className="bg-blue-700 rounded-xl py-4 items-center mb-4"
                >
                  <Text className="text-white font-bold text-lg">
                    Create Group
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Modal>
        </View>
      </LinearGradient>
    </SafeAreaView>
    // </ProtectedRoute>
  );
}
