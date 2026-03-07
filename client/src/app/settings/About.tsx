import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@/src/config/theme";

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
        <View className="pt-6 pb-4 px-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="pr-4">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">About</Text>
        </View>

        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            <Text className="text-gray-100 text-lg font-semibold mb-2">About Taskora</Text>
            <Text className="text-gray-400 text-sm leading-6 mb-4">
              Taskora is your intelligent productivity companion. Designed to help you manage tasks, 
              collaborate seamlessly with teams, and stay organized effortlessly.
            </Text>
            <Text className="text-gray-400 text-sm mb-2">Version: 1.0.0</Text>
            <Text className="text-gray-500 text-xs">© 2024 Taskora. All rights reserved.</Text>
          </View>

          <View className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <Text className="text-gray-100 text-lg font-semibold mb-3">Credits</Text>
            <Text className="text-gray-400 text-sm">
              Built with ❤️ using React Native, Expo, and a passion for productivity.
            </Text>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}