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
  getAllStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
  Status,
} from "@/src/services/statusService";
import StatusPriorityModal from "@/src/components/UI/StatusPriorityModal";
import { Button } from "@/src/components/UI/Buttons";

export default function ProjectStatuses() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadStatuses();
  }, [id]);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const data = await getAllStatuses(id as string);
      setStatuses(data);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to load statuses"
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStatus = async (data: {
    name: string;
    color?: string;
    order: number;
  }) => {
    try {
      setSaving(true);
      await createStatus(id as string, data);
      Alert.alert("Success", "Status created successfully");
      setModalVisible(false);
      loadStatuses();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create status"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (data: {
    name: string;
    color?: string;
    order: number;
  }) => {
    if (!editingStatus) return;

    try {
      setSaving(true);
      await updateStatus(id as string, editingStatus.id, data);
      Alert.alert("Success", "Status updated successfully");
      setModalVisible(false);
      setEditingStatus(null);
      loadStatuses();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStatus = async (statusId: string, statusName: string) => {
    Alert.alert(
      "Delete Status",
      `Are you sure you want to delete "${statusName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(statusId);
              await deleteStatus(id as string, statusId);
              Alert.alert("Success", "Status deleted successfully");
              loadStatuses();
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Failed to delete status"
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleEditPress = (status: Status) => {
    setEditingStatus(status);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingStatus(null);
  };

  const renderStatus = ({ item }: { item: Status }) => {
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
            onPress={() => handleDeleteStatus(item.id, item.name)}
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

  const isOwner = statuses.length > 0; // If we can load statuses, user has access

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Manage Statuses</Text>
        </View>

        {isOwner && (
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle" size={28} color="#60A5FA" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={statuses}
        keyExtractor={(item) => item.id}
        renderItem={renderStatus}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-10">
            <Ionicons name="list-outline" size={48} color="#4B5563" />
            <Text className="text-gray-500 text-base mt-4">No statuses found</Text>
            <Text className="text-gray-600 text-sm mt-2">
              Create your first status to get started
            </Text>
            <Button
              title="Create Status"
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
        onSave={editingStatus ? handleUpdateStatus : handleCreateStatus}
        initialData={
          editingStatus
            ? {
                name: editingStatus.name,
                color: editingStatus.color,
                order: editingStatus.order,
              }
            : undefined
        }
        title={editingStatus ? "Edit Status" : "Create Status"}
        loading={saving}
      />
    </SafeAreaView>
  );
}
