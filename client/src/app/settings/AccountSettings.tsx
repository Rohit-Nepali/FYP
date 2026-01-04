import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@/src/config/theme";

export default function AccountSettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <LinearGradient colors={theme.background.gradient} className="flex-1">
        {/* Header */}
        <View className="pt-6 pb-4 px-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="pr-4">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Account Settings</Text>
        </View>

        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
            <Text className="text-gray-100 text-lg font-semibold mb-2">Profile Information</Text>
            <Text className="text-gray-400 text-sm mb-4">
              Update your name, email, or password here.
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/settings/EditProfile")}
              className="bg-blue-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-medium">Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <Text className="text-gray-100 text-lg font-semibold mb-3">Security</Text>
            <TouchableOpacity
              onPress={() => Alert.alert("Coming Soon", "Password reset feature coming soon")}
              className="flex-row justify-between items-center mb-3"
            >
              <Text className="text-gray-300">Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Alert.alert("Coming Soon", "Two-factor authentication coming soon")}
              className="flex-row justify-between items-center"
            >
              <Text className="text-gray-300">Two-Factor Authentication</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}