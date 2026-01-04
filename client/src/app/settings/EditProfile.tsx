import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { theme } from "@/src/config/theme";
export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      return Alert.alert("Missing Fields", "Name and email cannot be empty.");
    }
    setSaving(true);
    try {
      // Simulate async update (e.g., hitting an API or Firebase call)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Try again later.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <LinearGradient colors={theme.background.gradient} className="flex-1">
        {/* Header */}
        <View className="pt-6 pb-4 px-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="pr-4">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Edit Profile</Text>
        </View>

        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          <View className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center mb-3">
                <Text className="text-white font-bold text-2xl">
                  {name?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
              <Text className="text-gray-300 text-sm">
                Tap the fields below to update your details.
              </Text>
            </View>

            {/* Name */}
            <Text className="text-gray-400 text-sm mb-1">Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#6B7280"
              className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-4"
            />

            {/* Email */}
            <Text className="text-gray-400 text-sm mb-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-4"
            />

            {/* Password */}
            <Text className="text-gray-400 text-sm mb-1">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-6"
            />

            <TouchableOpacity
              disabled={saving}
              onPress={handleSave}
              className={`rounded-xl py-3 items-center ${
                saving ? "bg-blue-400" : "bg-blue-600"
              }`}
            >
              <Text className="text-white font-medium">
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <Text className="text-gray-100 text-lg font-semibold mb-3">
              Danger Zone
            </Text>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Confirm Deletion",
                  "Deleting your account is permanent. Continue?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive" },
                  ]
                )
              }
              className="flex-row items-center justify-center bg-red-600 py-3 rounded-xl"
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text className="text-white font-medium">Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}