import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import * as DocumentPicker from "expo-document-picker";
import { Button } from "@/src/components/UI/Buttons";
import {
  deleteAccount,
  updateProfile,
  uploadAvatar,
} from "@/src/services/userService";
import { resolveFileUrl } from "@/src/utils/url";
import { CustomAlert } from "@/src/components/UI/CustomAlert";

type AlertType = "default" | "success" | "error" | "warning" | "info";

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

const INITIAL_ALERT: AlertState = {
  visible: false,
  title: "",
  message: "",
  type: "default",
  showCancel: false,
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUserFromGoogle, logout } = useAuth();
  const isGoogleAccount = !!user?.googleId;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(
    user?.profileImage || null
  );
  const [alert, setAlert] = useState<AlertState>(INITIAL_ALERT);

  const originalName = user?.name || "";
  const originalEmail = user?.email || "";

  const hasChanges =
    name !== originalName || (!isGoogleAccount && email !== originalEmail);

  const showAlert = (config: Omit<AlertState, "visible">) => {
    setAlert({ ...config, visible: true });
  };

  const closeAlert = () => setAlert((prev) => ({ ...prev, visible: false }));

  const handlePickAvatar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setAvatarUploading(true);

        const updatedUser = await uploadAvatar({
          uri: asset.uri,
          name: asset.name || "avatar.jpg",
          type: asset.mimeType || "image/jpeg",
        });

        setLocalAvatarUri(updatedUser.profileImage || null);
        setUserFromGoogle({
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          profileImage: updatedUser.profileImage,
          createdAt: updatedUser.createdAt,
          googleId: updatedUser.googleId ?? user?.googleId,
        });

        showAlert({
          title: "Photo Updated",
          message: "Your profile photo has been updated successfully.",
          type: "success",
        });
      }
    } catch (error: any) {
      showAlert({
        title: "Upload Failed",
        message:
          error.message || "Failed to update profile image. Try again later.",
        type: "error",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSaveConfirmed = async () => {
    if (!name.trim() || !email.trim()) {
      showAlert({
        title: "Missing Fields",
        message: "Name and email cannot be empty.",
        type: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      const trimmedEmail = email.trim();
      const emailChanged = !isGoogleAccount && trimmedEmail !== originalEmail;
      const profileUpdatePayload: { name: string; email?: string } = {
        name: name.trim(),
      };

      if (!isGoogleAccount) {
        profileUpdatePayload.email = trimmedEmail;
      }

      const updatedUser = await updateProfile(profileUpdatePayload);
      setUserFromGoogle({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt,
        googleId: updatedUser.googleId ?? user?.googleId,
      });

      showAlert({
        title: "Profile Updated",
        message: "Your profile has been updated successfully.",
        type: "success",
        onConfirm: async () => {
          if (emailChanged) {
            await logout();
            router.replace({
              pathname: "/login",
              params: { email: trimmedEmail },
            });
            return;
          }

          router.back();
        },
      });
    } catch (error: any) {
      showAlert({
        title: "Update Failed",
        message: error.message || "Failed to update profile. Try again later.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!hasChanges || saving) {
      return;
    }

    showAlert({
      title: "Save Changes",
      message: "Do you want to save these profile changes?",
      type: "warning",
      showCancel: true,
      confirmText: "Yes",
      cancelText: "No",
      onConfirm: () => {
        void handleSaveConfirmed();
      },
    });
  };

  const handleDeleteAccountConfirmed = async () => {
    if (deletingAccount) {
      return;
    }

    setDeletingAccount(true);

    try {
      await deleteAccount();
      await logout();
      router.replace("/login");
    } catch (error: any) {
      showAlert({
        title: "Delete Failed",
        message:
          error.message || "Failed to delete your account. Try again later.",
        type: "error",
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    showAlert({
      title: "Delete Account",
      message:
        "This action is permanent and cannot be undone. Are you sure you want to delete your account?",
      type: "error",
      showCancel: true,
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: () => {
        void handleDeleteAccountConfirmed();
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        showCancel={alert.showCancel}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onClose={closeAlert}
        onConfirm={alert.onConfirm}
      />

      <View className="pt-6 pb-4 px-6 flex-row items-center border-b border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-800 items-center justify-center mr-3"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Edit Profile</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center py-8">
          <View className="relative">
            {localAvatarUri ? (
              <Image
                source={{ uri: resolveFileUrl(localAvatarUri) }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <View className="w-24 h-24 bg-gray-700 rounded-full items-center justify-center">
                <Text className="text-white font-bold text-3xl">
                  {name?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <TouchableOpacity
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full items-center justify-center border-2 border-gray-900"
              disabled={avatarUploading}
              onPress={handlePickAvatar}
            >
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-400 text-sm mt-3">
            {avatarUploading ? "Uploading..." : "Tap camera to update photo"}
          </Text>
        </View>

        {isGoogleAccount && (
          <View className="mx-4 mb-4 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 flex-row items-center">
            <Ionicons name="logo-google" size={16} color="#93C5FD" />
            <Text className="ml-2 text-blue-300 text-sm">
              Email is managed by Google and cannot be changed here.
            </Text>
          </View>
        )}

        <View className="mx-4 bg-gray-800 rounded-2xl border border-gray-700/50 overflow-hidden mb-4">
          <View className="px-4 pt-4 pb-3 border-b border-gray-700/50">
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Full Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#4B5563"
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              className="text-white text-base py-1"
            />
          </View>

          <View
            className={`px-4 pt-4 pb-3 ${isGoogleAccount ? "opacity-60" : ""}`}
          >
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Email Address
            </Text>
            <View className="flex-row items-center">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#4B5563"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isGoogleAccount}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className="flex-1 text-white text-base py-1"
              />
              {isGoogleAccount && (
                <Ionicons name="lock-closed" size={15} color="#6B7280" />
              )}
            </View>
          </View>
        </View>

        <View className="mx-4 mb-8">
          <Button
            title="Save Changes"
            onPress={handleSave}
            disabled={!hasChanges}
            loading={saving}
            variant="primary"
            className="w-full"
          />
        </View>

        <View className="mx-4 bg-gray-800 rounded-2xl border border-gray-700/50 p-4">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Danger Zone
          </Text>
          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            variant="danger-ghost"
            icon="trash-outline"
            loading={deletingAccount}
            className="w-full"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
