import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
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

interface Props {
  id: string;
  title: string;
  description?: string | null;
  membersCount?: number;
  status?: ProjectStatus;
  canUpdateStatus?: boolean;
  color?: string;
  onPress?: () => void;
  onStatusPress?: () => void;
}

export const ProjectCard: React.FC<Props> = ({
  title,
  description,
  membersCount = 0,
  status = "todo",
  canUpdateStatus = true,
  color = "#8b5cf6",
  onPress,
  onStatusPress,
}) => {
  // Convert hex to rgb for gradient
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, 0.1)`
      : "rgba(139, 92, 246, 0.1)";
  };

  return (
    <LinearGradient
      colors={["#1F2937", "#111827"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-xl p-4 mb-4 border border-gray-700/50 overflow-hidden"
    >
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          className="flex-row items-center flex-1"
        >
          <View
            className="w-12 h-12 rounded-xl justify-center items-center mr-3 border"
            style={{
              backgroundColor: hexToRgb(color),
              borderColor: color + "40",
            }}
          >
            <Ionicons name="list" size={22} color={color} />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-base">{title}</Text>
            {description ? (
              <Text className="text-gray-400 text-xs mt-1" numberOfLines={2}>
                {description}
              </Text>
            ) : null}
            <View className="flex-row items-center mt-2 gap-1">
              <Ionicons name="people" size={12} color="#8b7280" />
              <Text className="text-gray-400 text-xs font-medium">
                {membersCount} member{membersCount !== 1 ? "s" : ""}
              </Text>
            </View>
            <View
              className="mt-2 self-start rounded-full border px-2.5 py-1"
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
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onStatusPress}
          activeOpacity={0.7}
          className={`ml-2 rounded-lg px-3 py-2 border ${canUpdateStatus ? "bg-purple-500/10 border-purple-500/20" : "bg-gray-700/60 border-gray-600/50"}`}
        >
          <Ionicons
            name={canUpdateStatus ? "chevron-forward" : "lock-closed"}
            size={16}
            color={canUpdateStatus ? "#a78bfa" : "#9CA3AF"}
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default ProjectCard;