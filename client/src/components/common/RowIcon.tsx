import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/utils/colors";

export interface RowIconProps {
  name: keyof typeof Ionicons.glyphMap;
}

/**
 * Compact icon container used at the start of settings-style rows.
 */
export default function RowIcon({ name }: RowIconProps) {
  return (
    <View className="h-7 w-7 items-center justify-center rounded-lg bg-[#374151]">
      <Ionicons name={name} size={14} color={COLORS.accent} />
    </View>
  );
}
