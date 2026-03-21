import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={["#1F2937", "#111827"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-xl p-4 mb-4 border border-gray-700/50 overflow-hidden"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="text-white font-bold text-base mb-1">
              {title}
            </Text>

            {description ? (
              <Text className="text-gray-400 text-xs mb-3" numberOfLines={2}>
                {description}
              </Text>
            ) : null}
          </View>
          <View className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/20 ml-2">
            <Ionicons name="chevron-forward" size={16} color="#a78bfa" />
          </View>
        </View>

        <View className="flex-row items-center gap-3 mt-2 pt-3 border-t border-gray-700/30">
          <View className="flex-row items-center gap-1 bg-gray-800/50 rounded-lg px-2 py-1.5">
            <Ionicons name="people" size={14} color="#8B5CF6" />
            <Text className="text-gray-300 text-xs font-semibold">
              {membersCount} team
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}