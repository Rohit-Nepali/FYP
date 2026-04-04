import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ProjectStatus } from "@/src/services/projectService";

const STATUS_META: Record<
  ProjectStatus,
  { label: string; tint: string; border: string; background: string }
> = {
  todo: {
    label: "Todo",
    tint: "#9CA3AF",
    border: "#6B728040",
    background: "rgba(107, 114, 128, 0.14)",
  },
  in_progress: {
    label: "In Progress",
    tint: "#60A5FA",
    border: "#2563EB40",
    background: "rgba(37, 99, 235, 0.14)",
  },
  done: {
    label: "Done",
    tint: "#34D399",
    border: "#10B98140",
    background: "rgba(16, 185, 129, 0.14)",
  },
};

export default function BoardProjectCard({
  title,
  description,
  membersCount,
  status = "todo",
  canUpdateStatus = true,
  onPress,
  onStatusPress,
}: {
  title: string;
  description?: string;
  membersCount: number;
  status?: ProjectStatus;
  canUpdateStatus?: boolean;
  onPress: () => void;
  onStatusPress?: () => void;
}) {
  return (
    <LinearGradient
      colors={["#1F2937", "#111827"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-xl p-4 mb-4 border border-gray-700/50 overflow-hidden"
    >
      <View className="flex-row items-start justify-between mb-2">
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          className="flex-1 pr-2"
        >
          <Text className="text-white font-bold text-base mb-1">
            {title}
          </Text>

          {description ? (
            <Text className="text-gray-400 text-xs mb-3" numberOfLines={2}>
              {description}
            </Text>
          ) : null}

          <View
            className="self-start rounded-full border px-2.5 py-1"
            style={{
              backgroundColor: STATUS_META[status].background,
              borderColor: STATUS_META[status].border,
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: STATUS_META[status].tint }}
            >
              {STATUS_META[status].label}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onStatusPress}
          activeOpacity={0.7}
          className={`rounded-lg p-2 border ml-2 ${canUpdateStatus ? "bg-purple-500/10 border-purple-500/20" : "bg-gray-700/60 border-gray-600/50"}`}
        >
          <Ionicons
            name={canUpdateStatus ? "chevron-forward" : "lock-closed"}
            size={16}
            color={canUpdateStatus ? "#a78bfa" : "#9CA3AF"}
          />
        </TouchableOpacity>
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
  );
}