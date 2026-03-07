import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  getAllPriorities,
  createPriority,
  updatePriority,
  deletePriority,
  Priority,
} from "@/src/services/priorityService";
import StatusPriorityModal from "@/src/components/UI/StatusPriorityModal";
import { Button } from "@/src/components/UI/Buttons";

export default function ProjectPriorities() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPriority, setEditingPriority] = useState<Priority | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadPriorities();
  }, [id]);

  const loadPriorities = async () => {
    try {
      setLoading(true);
      const data = await getAllPriorities(id as string);
      setPriorities(data);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to load priorities"
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePriority = async (data: {
    name: string;
    color?: string;
    order: number;
  }) => {
    try {
      setSaving(true);
      await createPriority(id as string, data);
      Alert.alert("Success", "Priority created successfully");
      setModalVisible(false);
      loadPriorities();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create priority"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePriority = async (data: {
    name: string;
    color?: string;
    order: number;
  }) => {
    if (!editingPriority) return;

    try {
      setSaving(true);
      await updatePriority(id as string, editingPriority.id, data);
      Alert.alert("Success", "Priority updated successfully");
      setModalVisible(false);
      setEditingPriority(null);
      loadPriorities();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update priority"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePriority = async (priorityId: string, priorityName: string) => {
    Alert.alert(
      "Delete Priority",
      `Are you sure you want to delete "${priorityName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(priorityId);
              await deletePriority(id as string, priorityId);
              Alert.alert("Success", "Priority deleted successfully");
              loadPriorities();
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Failed to delete priority"
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleEditPress = (priority: Priority) => {
    setEditingPriority(priority);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingPriority(null);
  };

  const renderPriority = ({ item }: { item: Priority }) => {
    return (
      <View className="flex-row items-center justify-between p-4 bg-gray-800 rounded-xl mb-3 border border-gray-700">
        <View className="flex-row items-center flex-1">
          {/* Color indicator */}
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: item.color || "#6B7280" }}
          >
            <Text className="text-white font-bold text-sm">
              {item.order + 1}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-white font-medium text-base">{item.name}</Text>
            <Text className="text-gray-400 text-xs">Order: {item.order}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => handleEditPress(item)}
            className="p-2 bg-blue-900/20 rounded-lg"
          >
            <Ionicons name="create-outline" size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeletePriority(item.id, item.name)}
            disabled={deletingId === item.id}
            className="p-2 bg-red-900/20 rounded-lg"
          >
            {deletingId === item.id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#60A5FA" />
      </SafeAreaView>
    );
  }

  const isOwner = priorities.length > 0; // If we can load priorities, user has access

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Manage Priorities</Text>
        </View>

        {isOwner && (
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle" size={28} color="#60A5FA" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={priorities}
        keyExtractor={(item) => item.id}
        renderItem={renderPriority}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-10">
            <Ionicons name="flag-outline" size={48} color="#4B5563" />
            <Text className="text-gray-500 text-base mt-4">No priorities found</Text>
            <Text className="text-gray-600 text-sm mt-2">
              Create your first priority to get started
            </Text>
            <Button
              title="Create Priority"
              onPress={() => setModalVisible(true)}
              variant="primary"
              icon="add-circle"
              className="mt-6"
            />
          </View>
        }
      />

      <StatusPriorityModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSave={editingPriority ? handleUpdatePriority : handleCreatePriority}
        initialData={
          editingPriority
            ? {
                name: editingPriority.name,
                color: editingPriority.color,
                order: editingPriority.order,
              }
            : undefined
        }
        title={editingPriority ? "Edit Priority" : "Create Priority"}
        loading={saving}
      />
    </SafeAreaView>
  );
}
