import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { theme } from "@/src/config/theme";

export default function PrivacySecurityScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <LinearGradient colors={theme.background.gradient} className="flex-1">
        <View className="pt-6 pb-4 px-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="pr-4">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Privacy & Security</Text>
        </View>

        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            <Text className="text-gray-100 text-lg font-semibold mb-3">
              Privacy Controls
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert("Coming Soon", "Manage data sharing coming soon")}
              className="flex-row justify-between items-center mb-3"
            >
              <Text className="text-gray-300">Manage Data Sharing</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert("Coming Soon", "Clear activity history coming soon")}
              className="flex-row justify-between items-center"
            >
              <Text className="text-gray-300">Clear Activity History</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <Text className="text-gray-100 text-lg font-semibold mb-3">Security Settings</Text>
            <TouchableOpacity
              onPress={() => Alert.alert("Coming Soon", "Session management coming soon")}
              className="flex-row justify-between items-center mb-3"
            >
              <Text className="text-gray-300">Active Sessions</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert("Coming Soon", "App encryption details coming soon")}
              className="flex-row justify-between items-center"
            >
              <Text className="text-gray-300">Encryption & Data Safety</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}