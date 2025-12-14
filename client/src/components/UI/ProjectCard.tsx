import { View, Text, TouchableOpacity } from "react-native";
import * as Progress from "react-native-progress";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface Props {
  id: string;
  title: string;
  description?: string | null;
  membersCount?: number;
  progress?: number; // 0..1
  color?: string;
  onPress?: () => void;
}

export const ProjectCard: React.FC<Props> = ({
  title,
  description,
  membersCount = 0,
  progress = 0,
  color = "#8b5cf6",
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-gray-800 rounded-xl p-4"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg">{title}</Text>
          {description ? (
            <Text className="text-gray-400 text-sm mt-1">{description}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      <View className="mt-4">
        <Progress.Bar
          progress={progress}
          width={null}
          color={color}
          unfilledColor="#111827"
          borderWidth={0}
          height={8}
        />
        <View className="flex-row justify-between mt-2">
          <Text className="text-gray-400 text-xs">{Math.round(progress * 100)}% complete</Text>
          <Text className="text-gray-400 text-xs">{membersCount} member{membersCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProjectCard;
