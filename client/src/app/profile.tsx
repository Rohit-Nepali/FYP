import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../config/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const profileOptions = [
    {
      title: "Account Settings",
      icon: "person-outline",
      onPress: () => {
        // Navigate to account settings
        Alert.alert("Coming Soon", "Account settings will be available soon!");
      },
    },
    {
      title: "Task Settings",
      icon: "settings-outline",
      onPress: () => {
        router.push("/task-settings");
      },
    },
    {
      title: "Notifications",
      icon: "notifications-outline",
      rightComponent: (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: "#374151", true: "#8b5cf6" }}
          thumbColor={notificationsEnabled ? "#ffffff" : "#9ca3af"}
        />
      ),
    },
    {
      title: "Appearance",
      icon: "moon-outline",
      rightComponent: (
        <Switch
          value={darkModeEnabled}
          onValueChange={setDarkModeEnabled}
          trackColor={{ false: "#374151", true: "#8b5cf6" }}
          thumbColor={darkModeEnabled ? "#ffffff" : "#9ca3af"}
        />
      ),
    },
    {
      title: "Privacy & Security",
      icon: "shield-checkmark-outline",
      onPress: () => {
        Alert.alert("Coming Soon", "Privacy settings will be available soon!");
      },
    },
    {
      title: "Help & Support",
      icon: "help-circle-outline",
      onPress: () => {
        Alert.alert("Coming Soon", "Help & Support will be available soon!");
      },
    },
    {
      title: "About",
      icon: "information-circle-outline",
      onPress: () => {
        Alert.alert(
          "About Taskora",
          "Taskora v1.0.0\nA productivity app for managing tasks and collaborating with teams.",
          [{ text: "OK" }]
        );
      },
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <LinearGradient colors={theme.background.gradient} className="flex-1">
        {/* Header */}
        <View className="pt-6 pb-4 px-6 bg-gray-900/50">
          <View className="flex-row items-center justify-center">
            <Text className="text-xl font-bold text-white">Profile</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* User Profile Card */}
          <View className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
            <View className="items-center mb-4">
              <View className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center mb-3">
                <Text className="text-white font-bold text-2xl">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
              <Text className="text-white text-xl font-bold mb-1">
                {user?.name || "User"}
              </Text>
              <Text className="text-gray-400 text-sm">
                {user?.email || "user@example.com"}
              </Text>
              <View className="flex-row items-center mt-2">
                <View className="bg-blue-600 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-medium capitalize">
                    {user?.role || "user"}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Coming Soon",
                  "Edit profile will be available soon!"
                );
              }}
              className="bg-blue-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-medium">Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Section */}
          <View className="bg-gray-800 rounded-xl border border-gray-700 mb-6">
            <Text className="text-gray-300 text-lg font-semibold px-4 py-4 border-b border-gray-700">
              Settings
            </Text>

            {profileOptions.map((option, index) => (
              <TouchableOpacity
                key={option.title}
                onPress={option.onPress}
                className={`flex-row items-center justify-between px-4 py-4 ${index < profileOptions.length - 1
                    ? "border-b border-gray-700"
                    : ""
                  }`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color="#9CA3AF"
                    style={{ marginRight: 12 }}
                  />
                  <Text className="text-gray-200 font-medium">
                    {option.title}
                  </Text>
                </View>
                {option.rightComponent || (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#6B7280"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Account Actions */}
          <View className="bg-gray-800 rounded-xl border border-gray-700 mb-6">
            <TouchableOpacity
              onPress={() => setShowLogoutModal(true)}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color="#EF4444"
                  style={{ marginRight: 12 }}
                />
                <Text className="text-red-400 font-medium">Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View className="items-center py-4">
            <Text className="text-gray-500 text-sm">Taskora v1.0.0</Text>
            <Text className="text-gray-600 text-xs mt-1">
              © 2024 Taskora. All rights reserved.
            </Text>
          </View>
        </ScrollView>

        {/* Logout Confirmation Modal */}
        <Modal
          visible={showLogoutModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <View className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
              <Text className="text-white text-xl font-bold mb-2 text-center">
                Logout
              </Text>
              <Text className="text-gray-300 text-center mb-6">
                Are you sure you want to logout?
              </Text>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowLogoutModal(false)}
                  className="flex-1 bg-gray-700 rounded-xl py-3 items-center"
                >
                  <Text className="text-gray-200 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                  }}
                  className="flex-1 bg-red-600 rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-medium">Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}
