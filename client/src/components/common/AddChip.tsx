import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/utils/colors";

export interface AddChipProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Dashed action chip used to open create flows (status/priority, etc).
 */
export default function AddChip({
  onPress,
  disabled = false,
  label = "Add",
}: AddChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      className="flex-row items-center gap-[3px] rounded-[20px] border border-dashed border-[#4B5563] px-[9px] py-[6px]"
    >
      <Ionicons name="add" size={12} color={COLORS.textSub} />
      <Text className="text-xs text-[#9CA3AF]">{label}</Text>
    </TouchableOpacity>
  );
}
