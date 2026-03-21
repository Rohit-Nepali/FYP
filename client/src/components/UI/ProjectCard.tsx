import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";

interface Props {
  id: string;
  title: string;
  description?: string | null;
  membersCount?: number;
  color?: string;
  onPress?: () => void;
}

export const ProjectCard: React.FC<Props> = ({
  title,
  membersCount = 0,
  color = "#8b5cf6",
  onPress,
}) => {
  // Convert hex to rgb for gradient
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, 0.1)`
      : "rgba(139, 92, 246, 0.1)";
  };

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
        <View className="flex-row items-center">
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
            <View className="flex-row items-center mt-2 gap-1">
              <Ionicons name="people" size={12} color="#8b7280" />
              <Text className="text-gray-400 text-xs font-medium">
                {membersCount} member{membersCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
          <View className="bg-purple-500/10 rounded-lg px-3 py-1.5 border border-purple-500/20">
            <Ionicons name="chevron-forward" size={16} color="#a78bfa" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default ProjectCard;