import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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
import useAlert from "@/src/hooks/useAlert";
import { resolveFileUrl } from "@/src/utils/url";

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
  projectOwnerId?: string;
}

export default function AddMembersModal({
  visible,
  onClose,
  projectId,
  onSuccess,
  existingMemberIds = [],
  projectOwnerId,
}: Props) {
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set(existingMemberIds));
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [hasAddedMembers, setHasAddedMembers] = useState(false);

  // Use custom alert hook
  const { showError, showSuccess, AlertComponent } = useAlert();

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
        showError(err instanceof Error ? err.message : "Failed to load users");
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
      setMemberIds(new Set(existingMemberIds));
      setSearchLoading(false);
      setAddingUserId(null);
      sheetHeight.setValue(INITIAL_SHEET_HEIGHT);
    }
  }, [visible, existingMemberIds]);

  useEffect(() => {
    if (visible) {
      setMemberIds(new Set(existingMemberIds));
    }
  }, [existingMemberIds, visible]);

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
          handleClose();
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

  const handleClose = () => {
    if (hasAddedMembers) {
      onSuccess?.();
      setHasAddedMembers(false);
    }
    onClose();
  };

  const handleAddMember = async (user: UserLite) => {
    if (memberIds.has(user.id) || addingUserId === user.id) return;

    try {
      setAddingUserId(user.id);
      await addProjectMembers(projectId, [user.id]);
      setMemberIds((prev) => {
        const next = new Set(prev);
        next.add(user.id);
        return next;
      });
      setHasAddedMembers(true);
      showSuccess(`${user.name || user.email} added to the project`);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to add member");
    } finally {
      setAddingUserId(null);
    }
  };

  const renderUserItem = ({ item }: { item: UserLite }) => {
    const isOwner = Boolean(projectOwnerId && item.id === projectOwnerId);
    const alreadyMember = memberIds.has(item.id);
    const isAdding = addingUserId === item.id;
    const isDisabled = alreadyMember || isOwner || isAdding;

    return (
      <View className="flex-row items-center py-3 px-4">
        {/* Avatar */}
        {item.avatarUrl ? (
          <Image
            source={{ uri: resolveFileUrl(item.avatarUrl) }}
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
            className={`text-sm font-medium ${isDisabled ? "text-gray-400" : "text-white"
              }`}
          >
            {item.name || item.email}
          </Text>
          {isOwner ? (
            <Text className="text-gray-500 text-xs" numberOfLines={1}>
              You are the project owner
            </Text>
          ) : (
            <Text className="text-gray-500 text-xs" numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>

        {/* Right side status / checkbox */}
        {isOwner ? (
          <Text className="text-xs text-gray-500">Owner</Text>
        ) : alreadyMember ? (
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text className="text-xs text-green-400 ml-1">Member</Text>
          </View>
        ) : isAdding ? (
          <View className="w-8 h-8 rounded-full bg-gray-700 items-center justify-center">
            <ActivityIndicator size="small" color="#60A5FA" />
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => handleAddMember(item)}
            disabled={isDisabled}
            className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center"
          >
            <Ionicons
              name="person-add-outline"
              size={16}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View className="flex-1">
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={handleClose}>
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
              <TouchableOpacity onPress={handleClose}>
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

            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {AlertComponent}
    </>
  );
}