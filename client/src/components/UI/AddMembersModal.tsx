import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { addProjectMembers, searchUsers, UserLite } from "@/src/services/userService";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SCREEN_WIDTH = Dimensions.get("window").width;
const MIN_SHEET_HEIGHT = SCREEN_HEIGHT * 0.3;
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;
const INITIAL_SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

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

  // Animation values
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const sheetHeight = useRef(new Animated.Value(INITIAL_SHEET_HEIGHT)).current;

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

  // Animate sheet in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 9,
        }),
      ]).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Reset state when closing
  useEffect(() => {
    if (!visible) {
      setSearch("");
      setUsers([]);
      setSelectedIds(new Set());
      setSearchLoading(false);
      setAdding(false);
      sheetHeight.setValue(INITIAL_SHEET_HEIGHT);
    }
  }, [visible]);

  // Pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Only allow dragging down
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Close if dragged down significantly
          onClose();
        } else {
          // Snap back to position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 9,
          }).start();
        }
      },
    })
  ).current;

  const toggleSelect = (userId: string, alreadyMember: boolean) => {
    if (alreadyMember) return;
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

    return (
      <TouchableOpacity
        onPress={() => toggleSelect(item.id, alreadyMember)}
        disabled={alreadyMember}
        className="flex-row items-center py-3 px-4"
      >
        {/* Avatar */}
        {item.avatarUrl ? (
          <Image
            source={{ uri: item.avatarUrl }}
            className="w-10 h-10 rounded-full mr-3"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-gray-700 mr-3 items-center justify-center">
            <Text className="text-white text-sm font-semibold">
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
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1">
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1 bg-black/60" />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: MAX_SHEET_HEIGHT,
            transform: [{ translateY }],
          }}
        >
          <LinearGradient
            colors={["#1F2937", "#111827"]}
            className="flex-1 border-gray-700 "
            style={{
              paddingHorizontal: 16,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: 'hidden', // Important! Clips content to rounded corners
            }}
          >
            {/* Drag Handle */}
            <View
              {...panResponder.panHandlers}
              className="items-center py-3"
            >
              <View className="w-12 h-1 bg-gray-600 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row justify-between items-center mb-4 px-2">
              <Text className="text-xl font-bold text-white">
                Add Members
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View className="mb-3 px-2">
              <Text className="text-gray-400 text-xs mb-2">
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
                  className="flex-1 text-white py-3"
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

            {/* Users list - Scrollable */}
            <View className="flex-1 mb-3">
              {searchLoading && users.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="small" color="#60A5FA" />
                  <Text className="text-gray-400 text-xs mt-2">
                    Searching users...
                  </Text>
                </View>
              ) : users.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                  <Ionicons name="person-outline" size={32} color="#4B5563" />
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
                    <View className="h-px bg-gray-800 mx-4" />
                  )}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  keyboardDismissMode="on-drag"
                  contentContainerStyle={{ paddingBottom: 16 }}
                />
              )}
            </View>

            {/* Footer: selected count + action */}
            <View className="flex-row items-center justify-between py-4 px-2 border-t border-gray-800">
              <Text className="text-gray-400 text-sm">
                {selectedCount === 0
                  ? "No users selected"
                  : `${selectedCount} user${selectedCount > 1 ? "s" : ""
                  } selected`}
              </Text>

              <TouchableOpacity
                onPress={handleAddMembers}
                disabled={adding || selectedCount === 0}
                className={`px-5 py-3 rounded-xl flex-row items-center ${selectedCount === 0 || adding ? "bg-gray-700" : "bg-blue-600"
                  }`}
              >
                {adding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add-outline" size={16} color="#fff" />
                    <Text className="text-white font-semibold text-sm ml-2">
                      Add
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}