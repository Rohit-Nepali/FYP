import React from "react";
import { View, Text } from "react-native";

export default function BoardColumn({
  title,
  count,
  color,
  children,
}: {
  title: string;
  count: number;
  color: string; // e.g. "bg-blue-600"
  children: React.ReactNode;
}) {
  return (
    <View className="w-72 mr-4 rounded-2xl border border-gray-700 bg-gray-900/60 p-3">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white font-bold text-lg">{title}</Text>
        <View className={`px-2 py-1 rounded-full ${color}`}>
          <Text className="text-white text-xs font-semibold">{count}</Text>
        </View>
      </View>

      <View className="space-y-3">{children}</View>
    </View>
  );
}