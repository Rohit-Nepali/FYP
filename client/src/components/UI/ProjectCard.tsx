import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-gray-800 rounded-xl p-4 mb-4"
    >
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-full justify-center items-center mr-3"
          style={{ backgroundColor: color }}
        >
          <Ionicons name="list" size={20} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg">{title}</Text>
          <Text className="text-gray-400 text-sm mt-1">
            {membersCount} member{membersCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProjectCard;