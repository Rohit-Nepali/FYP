import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BoardProjectCard({
  title,
  description,
  membersCount,
  onPress,
}: {
  title: string;
  description?: string;
  membersCount: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-gray-800 rounded-2xl p-4 shadow-md"
    >
      <Text className="text-white font-semibold text-base mb-1">
        {title}
      </Text>

      {description ? (
        <Text className="text-gray-400 text-sm mb-3" numberOfLines={2}>
          {description}
        </Text>
      ) : null}

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={16} color="#9CA3AF" />
          <Text className="text-gray-400 text-sm ml-1">
            {membersCount}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#6B7280" />
      </View>
    </TouchableOpacity>
  );
}