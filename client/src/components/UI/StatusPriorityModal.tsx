import React, { useState, useEffect } from "react";
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
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color?: string; order: number }) => Promise<void>;
  initialData?: { name: string; color?: string; order: number };
  title: string;
  loading: boolean;
}

const PRESET_COLORS = [
  "#6B7280", // Gray
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#10B981", // Green
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#0EA5E9", // Sky
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#F43F5E", // Rose
];

export default function StatusPriorityModal({
  visible,
  onClose,
  onSave,
  initialData,
  title,
  loading,
}: Props) {
  const [name, setName] = useState(initialData?.name || "");
  const [color, setColor] = useState(initialData?.color || PRESET_COLORS[0]);
  const [order, setOrder] = useState(initialData?.order?.toString() || "0");
  const [customColor, setCustomColor] = useState("");

  // Update form fields when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setColor(initialData.color || PRESET_COLORS[0]);
      setOrder(initialData.order?.toString() || "0");
      setCustomColor("");
    } else {
      // Reset form for create mode
      setName("");
      setColor(PRESET_COLORS[0]);
      setOrder("0");
      setCustomColor("");
    }
  }, [initialData]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter a name.");
      return;
    }

    const orderNum = parseInt(order, 10);
    if (isNaN(orderNum)) {
      Alert.alert("Validation Error", "Please enter a valid order number.");
      return;
    }

    const finalColor = customColor.trim() || color;

    try {
      await onSave({
        name: name.trim(),
        color: finalColor,
        order: orderNum,
      });
      // Reset form on success
      setName("");
      setColor(PRESET_COLORS[0]);
      setOrder("0");
      setCustomColor("");
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  const handleClose = () => {
    setName("");
    setColor(PRESET_COLORS[0]);
    setOrder("0");
    setCustomColor("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-center items-center bg-black/60 px-4">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="w-full max-w-sm"
        >
          <LinearGradient
            colors={["#1F2937", "#111827"]}
            className="rounded-2xl p-6 border border-gray-700 w-full"
          >
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-white">{title}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <View className="mb-4">
                <Text className="text-gray-400 text-xs mb-2 ml-1">Name</Text>
                <View className="flex-row items-center bg-gray-800 rounded-xl border border-gray-700 px-3">
                  <Ionicons
                    name="text-outline"
                    size={18}
                    color="#6B7280"
                    style={{ marginRight: 6 }}
                  />
                  <TextInput
                    className="flex-1 text-white py-3"
                    placeholder="Enter name"
                    placeholderTextColor="#6B7280"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Order Input */}
              <View className="mb-4">
                <Text className="text-gray-400 text-xs mb-2 ml-1">Order</Text>
                <View className="flex-row items-center bg-gray-800 rounded-xl border border-gray-700 px-3">
                  <Ionicons
                    name="list-outline"
                    size={18}
                    color="#6B7280"
                    style={{ marginRight: 6 }}
                  />
                  <TextInput
                    className="flex-1 text-white py-3"
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={order}
                    onChangeText={setOrder}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Color Picker */}
              <View className="mb-4">
                <Text className="text-gray-400 text-xs mb-2 ml-1">Color</Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((presetColor) => (
                    <TouchableOpacity
                      key={presetColor}
                      onPress={() => {
                        setColor(presetColor);
                        setCustomColor("");
                      }}
                      className={`w-10 h-10 rounded-full border-2 ${
                        color === presetColor && !customColor
                          ? "border-white"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: presetColor }}
                    >
                      {color === presetColor && !customColor && (
                        <View className="flex-1 items-center justify-center">
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Color Input */}
                <View className="flex-row items-center bg-gray-800 rounded-xl border border-gray-700 px-3">
                  <Ionicons
                    name="color-palette-outline"
                    size={18}
                    color="#6B7280"
                    style={{ marginRight: 6 }}
                  />
                  <TextInput
                    className="flex-1 text-white py-3"
                    placeholder="#FFFFFF (optional)"
                    placeholderTextColor="#6B7280"
                    value={customColor}
                    onChangeText={setCustomColor}
                    autoCapitalize="characters"
                    maxLength={7}
                  />
                  {customColor && (
                    <View
                      className="w-6 h-6 rounded-full border border-gray-600"
                      style={{ backgroundColor: customColor }}
                    />
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={handleClose}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-700"
                disabled={loading}
              >
                <Text className="text-white font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={loading || !name.trim()}
                className={`flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center ${
                  loading || !name.trim() ? "bg-gray-700" : "bg-blue-600"
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={16}
                      color="#fff"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-white font-semibold">Save</Text>
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
