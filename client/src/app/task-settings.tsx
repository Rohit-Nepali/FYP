import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../config/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Status,
  getAllStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from "../services/statusService";
import {
  Priority,
  getAllPriorities,
  createPriority,
  updatePriority,
  deletePriority,
} from "../services/priorityService";

export default function TaskSettingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"status" | "priority">("status");
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Status | Priority | null>(
    null
  );
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: "default" | "destructive";
    }>;
  } | null>(null);

  const defaultColors = [
    "#EF4444", // red
    "#F97316", // orange
    "#EAB308", // yellow
    "#22C55E", // green
    "#3B82F6", // blue
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#6B7280", // gray
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusesData, prioritiesData] = await Promise.all([
        getAllStatuses(),
        getAllPriorities(),
      ]);
      setStatuses(statusesData);
      setPriorities(prioritiesData);
    } catch (error) {
      showCustomAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showCustomAlert("Error", "Please enter a name");
      return;
    }

    try {
      if (editingItem) {
        if (activeTab === "status") {
          await updateStatus(editingItem.id, {
            name: name.trim(),
            color: color || undefined,
          });
          showCustomAlert("Success", "Status updated successfully");
        } else {
          await updatePriority(editingItem.id, {
            name: name.trim(),
            color: color || undefined,
          });
          showCustomAlert("Success", "Priority updated successfully");
        }
      } else {
        if (activeTab === "status") {
          await createStatus({
            name: name.trim(),
            color: color || undefined,
            order: statuses.length,
          });
          showCustomAlert("Success", "Status created successfully");
        } else {
          await createPriority({
            name: name.trim(),
            color: color || undefined,
            order: priorities.length,
          });
          showCustomAlert("Success", "Priority created successfully");
        }
      }
      resetForm();
      setModalVisible(false);
      loadData();
    } catch (error) {
      showCustomAlert(
        "Error",
        error instanceof Error ? error.message : "Failed to save"
      );
    }
  };

  const handleEdit = (item: Status | Priority) => {
    setEditingItem(item);
    setName(item.name);
    setColor(item.color || "");
    setModalVisible(true);
  };

  const handleDelete = (item: Status | Priority) => {
    showCustomAlert(
      "Delete",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "default" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (activeTab === "status") {
                await deleteStatus(item.id);
                showCustomAlert("Success", "Status deleted successfully");
              } else {
                await deletePriority(item.id);
                showCustomAlert("Success", "Priority deleted successfully");
              }
              loadData();
            } catch (error) {
              showCustomAlert(
                "Error",
                error instanceof Error ? error.message : "Failed to delete"
              );
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setEditingItem(null);
    setName("");
    setColor("");
  };

  const showCustomAlert = (
    title: string,
    message: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: "default" | "destructive";
    }>
  ) => {
    setCustomAlert({ visible: true, title, message, buttons });
  };

  const hideCustomAlert = () => {
    setCustomAlert(null);
  };

  const getColorStyle = (itemColor?: string) => {
    if (itemColor) {
      return { backgroundColor: itemColor };
    }
    return { backgroundColor: "#6B7280" };
  };

  const currentItems = activeTab === "status" ? statuses : priorities;

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <LinearGradient colors={theme.background.gradient} className="flex-1">
        {/* Header */}
        <View className="pt-6 pb-4 px-6 bg-gray-900/50">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">
              Task Settings
            </Text>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                setModalVisible(true);
              }}
            >
              <Ionicons name="add-circle" size={28} color="#60A5FA" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setActiveTab("status")}
              className={`flex-1 py-2 rounded-lg ${activeTab === "status" ? "bg-blue-600" : "bg-gray-800"
                }`}
            >
              <Text className="text-white text-center font-medium">
                Statuses
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("priority")}
              className={`flex-1 py-2 rounded-lg ${activeTab === "priority" ? "bg-blue-600" : "bg-gray-800"
                }`}
            >
              <Text className="text-white text-center font-medium">
                Priorities
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#60A5FA" />
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-4 py-4"
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            {currentItems.length === 0 ? (
              <View className="flex-1 justify-center items-center py-20">
                <Ionicons name="list-outline" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-lg mt-4">
                  No {activeTab === "status" ? "statuses" : "priorities"}{" "}
                  found
                </Text>
                <Text className="text-gray-500 text-sm mt-2">
                  Create your first{" "}
                  {activeTab === "status" ? "status" : "priority"} to get
                  started
                </Text>
              </View>
            ) : (
              currentItems.map((item) => (
                <View
                  key={item.id}
                  className="bg-gray-800 rounded-xl p-4 mb-3 border border-gray-700"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-4 h-4 rounded-full mr-3"
                        style={getColorStyle(item.color)}
                      />
                      <Text className="text-white text-lg font-semibold flex-1">
                        {item.name}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleEdit(item)}
                        className="px-3 py-1 bg-blue-600 rounded-lg"
                      >
                        <Text className="text-white text-sm">Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item)}
                        className="px-3 py-1 bg-red-600 rounded-lg"
                      >
                        <Text className="text-white text-sm">Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Create/Edit Modal */}
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
              className="rounded-t-3xl p-6 max-h-[90%]"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-2xl font-bold text-white">
                  {editingItem
                    ? `Edit ${activeTab === "status" ? "Status" : "Priority"}`
                    : `New ${activeTab === "status" ? "Status" : "Priority"}`}
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

              <ScrollView>
                <View className="mb-4">
                  <Text className="text-gray-300 mb-2 font-medium">
                    Name *
                  </Text>
                  <TextInput
                    className="bg-gray-800 rounded-xl px-4 py-3 text-gray-200 border border-gray-700"
                    placeholder="Enter name"
                    placeholderTextColor="#6B7280"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-gray-300 mb-2 font-medium">
                    Color (optional)
                  </Text>
                  <TextInput
                    className="bg-gray-800 rounded-xl px-4 py-3 text-gray-200 border border-gray-700 mb-2"
                    placeholder="#000000"
                    placeholderTextColor="#6B7280"
                    value={color}
                    onChangeText={setColor}
                  />
                  <View className="flex-row flex-wrap gap-2">
                    {defaultColors.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setColor(c)}
                        className={`w-10 h-10 rounded-full ${color === c ? "border-2 border-white" : ""
                          }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleCreate}
                  className="bg-blue-600 rounded-xl py-4 items-center mb-4"
                >
                  <Text className="text-white font-bold text-lg">
                    {editingItem ? "Update" : "Create"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </View>
        </Modal>

        {/* Custom Alert Modal */}
        {customAlert && (
          <Modal
            visible={customAlert.visible}
            animationType="fade"
            transparent={true}
            onRequestClose={hideCustomAlert}
          >
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
              <View className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
                <Text className="text-white text-xl font-bold mb-2 text-center">
                  {customAlert.title}
                </Text>
                <Text className="text-gray-300 text-center mb-6">
                  {customAlert.message}
                </Text>

                <View className="flex-row gap-3">
                  {customAlert.buttons?.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        hideCustomAlert();
                        button.onPress?.();
                      }}
                      className={`flex-1 rounded-xl py-3 items-center ${button.style === "destructive"
                        ? "bg-red-600"
                        : "bg-gray-700"
                        }`}
                    >
                      <Text
                        className={`font-medium ${button.style === "destructive"
                          ? "text-white"
                          : "text-gray-200"
                          }`}
                      >
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  )) || (
                      <TouchableOpacity
                        onPress={hideCustomAlert}
                        className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
                      >
                        <Text className="text-white font-medium">OK</Text>
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            </View>
          </Modal>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}
