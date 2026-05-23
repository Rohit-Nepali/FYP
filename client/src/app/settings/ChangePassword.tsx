import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FormInput } from "@/src/components/common/FormInput";
import { PrimaryButton } from "@/src/components/UI/Buttons";
import { CustomAlert } from "@/src/components/UI/CustomAlert";
import { changePassword } from "@/src/services/userService";
import { clearTokens } from "@/src/services/authService";
import { useAuth } from "@/src/contexts/AuthContext";
import { theme } from "@/src/config/theme";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user, clearAuthState } = useAuth();
  const isGoogleAccount = !!user?.googleId;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<
    "default" | "success" | "error" | "warning" | "info"
  >("default");

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      type: "default" | "success" | "error" | "warning" | "info" = "default"
    ) => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertType(type);
      setAlertVisible(true);
    },
    []
  );

  const validateForm = useCallback(() => {
    const newErrors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = "Password must contain at least one number";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [confirmPassword, currentPassword, newPassword]);

  const handleSubmit = useCallback(async () => {
    if (isGoogleAccount) {
      showAlert(
        "Google Account",
        "Password changes are managed through Google for this account.",
        "warning"
      );
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      await clearTokens();
      clearAuthState();

      showAlert(
        "Password Changed",
        "Your password has been updated. Please sign in again with your new password.",
        "success"
      );
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to change password";
      showAlert("Password Change Failed", errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isGoogleAccount,
    validateForm,
    currentPassword,
    newPassword,
    clearAuthState,
    showAlert,
  ]);

  const isSubmitDisabled = useMemo(
    () => isSubmitting || isGoogleAccount,
    [isSubmitting, isGoogleAccount]
  );

  const buttonText = useMemo(() => {
    if (isGoogleAccount) return "Managed by Google";
    return isSubmitting ? "Updating..." : "Update Password";
  }, [isSubmitting, isGoogleAccount]);

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => {
          setAlertVisible(false);
          if (alertType === "success") {
            router.replace({ pathname: "/login" });
          }
        }}
      />

      <View className="pt-6 pb-4 px-6 flex-row items-center border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 items-center justify-center mr-3">
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Change Password</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 28, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isGoogleAccount && (
            <View className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 flex-row items-center">
              <Ionicons name="logo-google" size={16} color="#93C5FD" />
              <Text className="ml-2 text-blue-300 text-sm">
                Password changes are managed through Google for this account.
              </Text>
            </View>
          )}

          <View className="bg-gray-800 rounded-2xl border border-gray-700/50 p-5">
            <Text className="text-gray-100 text-lg font-semibold mb-1">Update Password</Text>
            <Text className="text-gray-500 text-xs mb-5">
              Use your current password to create a new one.
            </Text>

            <FormInput
              icon="lock-closed-outline"
              placeholder="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              showPasswordToggle
              isPasswordVisible={showCurrentPassword}
              onTogglePassword={() => setShowCurrentPassword((prev) => !prev)}
              error={errors.currentPassword}
            />

            <FormInput
              icon="lock-closed-outline"
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              showPasswordToggle
              isPasswordVisible={showNewPassword}
              onTogglePassword={() => setShowNewPassword((prev) => !prev)}
              error={errors.newPassword}
            />

            <FormInput
              icon="lock-closed-outline"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              showPasswordToggle
              isPasswordVisible={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
              error={errors.confirmPassword}
            />

            <View className="bg-blue-500/10 rounded-xl p-4 mb-5 border border-blue-500/20">
              <Text className="text-gray-300 text-sm font-semibold mb-2">
                Password requirements:
              </Text>
              <Text className="text-gray-400 text-xs leading-5">
                At least 8 characters, including one uppercase letter, one lowercase letter, and one number.
              </Text>
            </View>

            <PrimaryButton
              title={buttonText}
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              loading={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
