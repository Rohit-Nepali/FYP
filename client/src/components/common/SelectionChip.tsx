import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/utils/colors";

export interface SelectionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  dotColor?: string;
}

/**
 * Selectable pill chip with semantic dot state and optional selected check icon.
 */
export default function SelectionChip({
  label,
  selected,
  onPress,
  disabled = false,
  dotColor = COLORS.accent,
}: SelectionChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      className={`flex-row items-center gap-[5px] rounded-[20px] border px-[11px] py-[6px] ${
        selected ? "border-[#2563EB] bg-[#1E3A8A]" : "border-[#4B5563] bg-[#374151]"
      }`}
    >
      <View
        className={`h-[6px] w-[6px] rounded-full ${
          selected
            ? dotColor === COLORS.danger
              ? "bg-[#EF4444]"
              : dotColor === COLORS.warning
                ? "bg-[#F59E0B]"
                : dotColor === COLORS.success
                  ? "bg-[#10B981]"
                  : "bg-[#3B82F6]"
            : "bg-[#9CA3AF]"
        }`}
      />
      <Text className={`text-xs ${selected ? "font-semibold text-[#F3F4F6]" : "text-[#9CA3AF]"}`}>
        {label}
      </Text>
      {selected && <Ionicons name="checkmark" size={11} color={COLORS.accent} />}
    </TouchableOpacity>
  );
}
