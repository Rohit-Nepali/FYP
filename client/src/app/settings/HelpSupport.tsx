import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { theme } from "@/src/config/theme";

export default function HelpSupportScreen() {
  const router = useRouter();

  const openSupportEmail = () => {
    Linking.openURL("mailto:support@taskora.app").catch(() =>
      Alert.alert("Error", "Unable to open mail client.")
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="pt-6 pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="pr-4">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Help & Support</Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <Text className="text-gray-100 text-lg font-semibold mb-3">FAQ</Text>
          <Text className="text-gray-400 text-sm mb-4">
            Browse through frequently asked questions about using Taskora.
          </Text>
          <TouchableOpacity
            onPress={() => Alert.alert("Coming Soon", "FAQ page will be available soon!")}
            className="flex-row justify-between items-center"
          >
            <Text className="text-gray-300">View FAQ</Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <Text className="text-gray-100 text-lg font-semibold mb-3">Contact Us</Text>
          <Text className="text-gray-400 text-sm mb-4">
            Need further help? Reach out to our support team via email.
          </Text>
          <TouchableOpacity onPress={openSupportEmail} className="bg-blue-600 rounded-xl py-3 items-center">
            <Text className="text-white font-medium">Email Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}