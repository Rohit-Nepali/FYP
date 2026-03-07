import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@/src/config/theme";
import { useAuth } from "@/src/contexts/AuthContext";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="pt-6 pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="pr-4">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Account Settings</Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* PROFILE Section Header */}
        <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-1 mb-2">
          Profile
        </Text>

        {/* Profile Information Section */}
        <View className="bg-gray-800/80 rounded-xl p-6 border border-gray-700/50 mb-6">
          <Text className="text-gray-100 text-lg font-semibold mb-4">Profile Information</Text>

          {/* Display Current Info */}
          <View className="mb-4">
            <View className="flex-row items-center">
                <View className="w-14 h-14 bg-gray-800 rounded-full items-center justify-center">
                  <Text className="text-white font-bold text-xl">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              <View className="flex-1 justify-center">
                <Text className="text-white font-semibold text-lg">{user?.name}</Text>
                <Text className="text-gray-400 text-sm">{user?.email}</Text>
              </View>
              {/* Edit button - redirects to EditProfile page */}
              <TouchableOpacity
                onPress={() => router.push("/settings/EditProfile")}
                className="p-2"
              >
                <Ionicons name="pencil" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECURITY Section Header */}
        <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-1 mb-2">
          Security
        </Text>

        {/* Security Section */}
        <View className="bg-gray-800/80 rounded-xl border border-gray-700/50 mb-6">
          <TouchableOpacity
            onPress={() => Alert.alert("Coming Soon", "Password reset feature coming soon")}
            className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-700/30"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-gray-700/50 rounded-lg items-center justify-center mr-3">
                <Ionicons name="key-outline" size={18} color="#9CA3AF" />
              </View>
              <View>
                <Text className="text-gray-200 font-medium">Change Password</Text>
                <Text className="text-gray-500 text-xs">Last changed 4 months ago</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert("Coming Soon", "Two-factor authentication coming soon")}
            className="flex-row items-center justify-between px-4 py-3.5"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-gray-700/50 rounded-lg items-center justify-center mr-3">
                <Ionicons name="shield-checkmark-outline" size={18} color="#9CA3AF" />
              </View>
              <View>
                <Text className="text-gray-200 font-medium">Two-Factor Authentication</Text>
                <Text className="text-green-400 text-xs">Enabled</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
