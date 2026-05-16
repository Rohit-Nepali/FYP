import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export function SectionHeader({
    icon,
    title,
    count,
    action,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    count?: number;
    action?: React.ReactNode;
  }) {
    return (
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons name={icon} size={18} color="#60A5FA" />
          <Text className="text-white font-semibold text-base ml-2">
            {title}
          </Text>
          {count !== undefined && (
            <View className="bg-gray-700/60 rounded-full px-2 py-0.5 ml-2">
              <Text className="text-gray-300 text-xs font-medium">{count}</Text>
            </View>
          )}
        </View>
        {action}
      </View>
    );
  }