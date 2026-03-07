import React, { useState, useEffect } from "react";
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
import { updateProfile } from "@/src/services/userService";
import { Button } from "@/src/components/UI/Buttons";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUserFromGoogle } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Track original values to detect changes
  const originalName = user?.name || "";
  const originalEmail = user?.email || "";

  // Check if there are any changes
  const hasChanges = 
    name !== originalName || 
    email !== originalEmail || 
    password.trim() !== "";

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      return Alert.alert("Missing Fields", "Name and email cannot be empty.");
    }
    setSaving(true);
    try {
      // Call the API to update profile
      const updatedUser = await updateProfile({
        name: name.trim(),
        email: email.trim(),
      });

      // Update AuthContext with the new user data
      setUserFromGoogle({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt,
      });

      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile. Try again later.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
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
            {/* Avatar with gradient and camera overlay - matching Profile screen style */}
            <View className="relative mb-3">
              <View className="w-20 h-20 bg-gray-700 rounded-full items-center justify-center">
                <Text className="text-white font-bold text-2xl">
                  {name?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
              {/* Camera icon overlay */}
              <TouchableOpacity
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full items-center justify-center border-2 border-gray-800"
              >
                <Ionicons name="camera" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Name */}
          <Text className="text-gray-400 text-sm mb-1">Full Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor="#6B7280"
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            className={`bg-gray-700 text-white rounded-lg px-4 py-3 mb-4 border ${focusedField === 'name' ? 'border-blue-500' : 'border-transparent'}`}
          />

          {/* Email - Read-only with lock icon */}
          <Text className="text-gray-400 text-sm mb-1">Email</Text>
          <View className={`bg-gray-700 rounded-lg px-4 py-3 mb-4 border ${focusedField === 'email' ? 'border-blue-500' : 'border-transparent'} flex-row items-center`}>
            <TextInput
              value={email}
              placeholder="Enter your email"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              className="flex-1 text-white opacity-60"
            />
            <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
          </View>

          {/* Password */}
          <Text className="text-gray-400 text-sm mb-1">New Password</Text>
          <Text className="text-gray-500 text-xs mb-2">Leave blank to keep your current password.</Text>
          <View className={`bg-gray-700 rounded-lg px-4 py-3 mb-6 border ${focusedField === 'password' ? 'border-blue-500' : 'border-transparent'} flex-row items-center`}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              placeholderTextColor="#6B7280"
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              className="flex-1 text-white"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            disabled={!hasChanges}
            loading={saving}
            variant="primary"
            className="w-full"
          />
        </View>

        {/* Danger Zone - Increased margin */}
        <View className="bg-gray-800 rounded-xl border border-gray-700 p-6 mt-8">
          <Text className="text-gray-100 text-lg font-semibold mb-3">
            Danger Zone
          </Text>

          <Button
            title="Delete Account"
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
            variant="danger-ghost"
            icon="trash-outline"
            className="w-full"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}