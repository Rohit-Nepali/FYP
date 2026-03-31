import React from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/utils/colors";

export interface MiniInputModalProps {
  visible: boolean;
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onDismiss: () => void;
  loading: boolean;
  confirmLabel: string;
}

/**
 * Small centered modal for creating quick entities like status and priority.
 */
export default function MiniInputModal({
  visible,
  title,
  placeholder,
  value,
  onChange,
  onConfirm,
  onDismiss,
  loading,
  confirmLabel,
}: MiniInputModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onDismiss}
        className="flex-1 items-center justify-center bg-black/70 px-6"
      >
        <TouchableOpacity
          activeOpacity={1}
          className="w-full rounded-2xl border border-[#4B5563] bg-[#1F2937] p-5"
        >
          <View className="mb-[14px] flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-[#F3F4F6]">{title}</Text>
            <TouchableOpacity
              onPress={onDismiss}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={COLORS.textSub} />
            </TouchableOpacity>
          </View>
          <View className="mb-3 rounded-[10px] border border-[#4B5563] bg-[#111827]">
            <TextInput
              className="px-[14px] py-[11px] text-sm text-[#F3F4F6]"
              placeholder={placeholder}
              placeholderTextColor={COLORS.textMuted}
              value={value}
              onChangeText={onChange}
              editable={!loading}
              autoFocus
            />
          </View>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={loading}
            className={`flex-row items-center justify-center rounded-[10px] bg-[#3B82F6] py-3 ${
              loading ? "opacity-70" : "opacity-100"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-sm font-semibold text-white">{confirmLabel}</Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
