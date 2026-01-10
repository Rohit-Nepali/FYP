import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { addProjectMembers, searchUsers, UserLite } from "@/src/services/userService";
import { CLIENT_RENEG_LIMIT } from "tls";

interface Props {
  visible: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess?: () => void;
  existingMemberIds?: string[];
}

export default function AddMembersModal({
  visible,
  onClose,
  projectId,
  onSuccess,
  existingMemberIds = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 100);
    return () => clearTimeout(id);
  }, [search]);

  // Load users whenever modal is opened or search query changes
  useEffect(() => {
    if (!visible) return;

    const loadUsers = async () => {
      try {
        setSearchLoading(true);
        const result = await searchUsers(debouncedSearch);
        if (result && Array.isArray(result)) {
          setUsers(result);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("Failed to search users", err);
        Alert.alert(
          "Error",
          err instanceof Error ? err.message : "Failed to load users"
        );
      } finally {
        setSearchLoading(false);
      }
    };



    loadUsers();
  }, [visible, debouncedSearch]);

  // Add this after loading users
  useEffect(() => {
    console.log("Users state updated:", users.length, "users");
    console.log("First user:", users[0]);
  }, [users]);

  // Also check what existingMemberIds contains
  useEffect(() => {
    console.log("Existing member IDs:", existingMemberIds);
  }, [existingMemberIds]);
  // Reset state when closing
  useEffect(() => {
    if (!visible) {
      setSearch("");
      setUsers([]);
      setSelectedIds(new Set());
      setSearchLoading(false);
      setAdding(false);
    }
  }, [visible]);

  const toggleSelect = (userId: string, alreadyMember: boolean) => {
    if (alreadyMember) return; // don't allow selecting existing members
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleAddMembers = async () => {
    if (selectedIds.size === 0) {
      Alert.alert("Nothing selected", "Please select at least one user.");
      return;
    }

    try {
      setAdding(true);
      const userIds = Array.from(selectedIds);
      await addProjectMembers(projectId, userIds);
      Alert.alert("Success", "Members added to the project");
      onSuccess?.();
      onClose();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to add members"
      );
    } finally {
      setAdding(false);
    }
  };

  const renderUserItem = ({ item }: { item: UserLite }) => {
    const alreadyMember = existingMemberIds.includes(item.id);
    const isSelected = selectedIds.has(item.id);

    console.log("Rendering user:", item.email, "alreadyMember:", alreadyMember);

    return (
      <TouchableOpacity
        onPress={() => toggleSelect(item.id, alreadyMember)}
        disabled={alreadyMember}
        className="flex-row items-center py-2 px-1"
      >
        {/* Avatar */}
        {item.avatarUrl ? (
          <Image
            source={{ uri: item.avatarUrl }}
            className="w-9 h-9 rounded-full mr-3"
          />
        ) : (
          <View className="w-9 h-9 rounded-full bg-gray-700 mr-3 items-center justify-center">
            <Text className="text-white text-xs font-semibold">
              {item.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}

        {/* Name + email */}
        <View className="flex-1">
          <Text
            className={`text-sm font-medium ${alreadyMember ? "text-gray-400" : "text-white"
              }`}
          >
            {item.name || item.email}
          </Text>
          <Text className="text-gray-500 text-xs" numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        {/* Right side status / checkbox */}
        {alreadyMember ? (
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text className="text-xs text-green-400 ml-1">Member</Text>
          </View>
        ) : (
          <Ionicons
            name={isSelected ? "checkbox" : "square-outline"}
            size={22}
            color={isSelected ? "#3B82F6" : "#9CA3AF"}
          />
        )}
      </TouchableOpacity>
    );
  };

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/60 px-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="w-full max-w-sm"
        >
          <LinearGradient
            colors={["#1F2937", "#111827"]}
            className="rounded-2xl p-6 border border-gray-700 w-full"
            style={{ maxHeight: "90%" }}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-white">
                Add Members
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View className="mb-3">
              <Text className="text-gray-400 text-xs mb-2 ml-1">
                Search users
              </Text>
              <View className="flex-row items-center bg-gray-800 rounded-xl border border-gray-700 px-3">
                <Ionicons
                  name="search-outline"
                  size={18}
                  color="#6B7280"
                  style={{ marginRight: 6 }}
                />
                <TextInput
                  className="flex-1 text-white py-2"
                  placeholder="Name or email"
                  placeholderTextColor="#6B7280"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />
                {searchLoading && (
                  <ActivityIndicator size="small" color="#9CA3AF" />
                )}
              </View>
            </View>

            {/* Users list - FIXED: Scrollable area with proper boundaries  */}
            <View className=" mt-2 mb-3">
              {searchLoading && users.length === 0 ? (
                <View className="flex-1 justify-center items-center py-8">
                  <ActivityIndicator size="small" color="#60A5FA" />
                  <Text className="text-gray-400 text-xs mt-2">
                    Searching users...
                  </Text>
                </View>
              ) : users.length === 0 ? (
                <View className="flex-1 justify-center items-center py-8">
                  <Ionicons
                    name="person-outline"
                    size={32}
                    color="#4B5563"
                  />
                  <Text className="text-gray-500 text-sm mt-2">
                    No users found
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1 text-center">
                    Try a different name or email.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={users}
                  keyExtractor={(item) => item.id}
                  renderItem={renderUserItem}
                  ItemSeparatorComponent={() => (
                    <View className="h-px bg-gray-800" />
                  )}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  keyboardDismissMode="on-drag"
                />
              )}
            </View>

            {/* Footer: selected count + action */}
            <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-800">
              <Text className="text-gray-400 text-xs">
                {selectedCount === 0
                  ? "No users selected"
                  : `${selectedCount} user${selectedCount > 1 ? "s" : ""
                  } selected`}
              </Text>

              <TouchableOpacity
                onPress={handleAddMembers}
                disabled={adding || selectedCount === 0}
                className={`px-4 py-2 rounded-xl flex-row items-center ${selectedCount === 0 || adding
                  ? "bg-gray-700"
                  : "bg-blue-600"
                  }`}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="person-add-outline"
                      size={16}
                      color="#fff"
                    />
                    <Text className="text-white font-semibold text-sm ml-2">
                      Add
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}