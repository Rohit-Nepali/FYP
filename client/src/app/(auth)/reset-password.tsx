import React, { useCallback, useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../config/theme";
import { FormInput } from "@/src/components/common/FormInput";
import { PrimaryButton } from "@/src/components/UI/Buttons";
import { CustomAlert } from "@/src/components/UI/CustomAlert";
import { authService } from "../../services/authService";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token, email } = useLocalSearchParams();

  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<
    "default" | "success" | "error" | "warning" | "info"
  >("default");

  // Alert helper function
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

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        showAlert("Error", "Invalid or missing reset token", "error");
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      try {
        await authService.verifyResetToken(token as string);
        setIsVerifying(false);
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.error?.message ||
          error?.message ||
          "Invalid or expired reset token";

        showAlert("Error", errorMessage, "error");
        setTimeout(() => router.push("/login"), 2000);
      }
    };

    verifyToken();
  }, [token, router, showAlert]);

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors: {
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [password, confirmPassword]);

  // Handle reset password
  const handleResetPassword = useCallback(async () => {
    if (!validateForm() || !token) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await authService.resetPassword(token as string, password);
      showAlert(
        "Success",
        "Your password has been reset successfully. You can now log in with your new password.",
        "success"
      );

      // Redirect to login after a delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to reset password";

      showAlert("Error", errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [password, token, validateForm, router, showAlert]);

  // Handle password change
  const handlePasswordChange = useCallback(
    (text: string) => {
      setPassword(text);
      if (errors.password) {
        setErrors({ ...errors, password: undefined });
      }
    },
    [errors]
  );

  // Handle confirm password change
  const handleConfirmPasswordChange = useCallback(
    (text: string) => {
      setConfirmPassword(text);
      if (errors.confirmPassword) {
        setErrors({ ...errors, confirmPassword: undefined });
      }
    },
    [errors]
  );

  // Handle back
  const handleBack = useCallback(() => {
    router.push("/login");
  }, [router]);

  // Memoized button state
  const isSubmitDisabled = useMemo(
    () => isSubmitting || isVerifying,
    [isSubmitting, isVerifying]
  );

  const submitButtonText = useMemo(
    () =>
      isVerifying
        ? "Verifying..."
        : isSubmitting
          ? "Resetting..."
          : "Reset Password",
    [isSubmitting, isVerifying]
  );

  if (isVerifying) {
    return (
      <LinearGradient colors={theme.background.gradient} className="flex-1">
        <View className="flex-1 justify-center items-center">
          <Ionicons name="hourglass-outline" size={48} color="#64748b" />
          <Text className="text-gray-400 text-center mt-4">
            Verifying your reset token...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.background.gradient} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-8 justify-center">
          {/* Header Section */}
          <TouchableOpacity
            onPress={handleBack}
            className="absolute top-12 left-6 z-10"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.text.secondary}
            />
          </TouchableOpacity>

          <View className="items-center mb-10">
            <Text className="text-2xl font-bold text-gray-200 mb-2">
              Reset Your Password
            </Text>
            <Text className="text-base text-gray-400 text-center">
              Enter your new password below
            </Text>
          </View>

          {/* Form Section */}
          <View className="mb-8">
            <FormInput
              icon="lock-closed-outline"
              placeholder="New Password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              showPasswordToggle
              isPasswordVisible={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              error={errors.password}
            />

            <FormInput
              icon="lock-closed-outline"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry
              showPasswordToggle
              isPasswordVisible={showConfirmPassword}
              onTogglePassword={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              error={errors.confirmPassword}
            />

            {/* Password requirements */}
            <View className="bg-blue-500/10 rounded-lg p-4 mb-6 border border-blue-500/20">
              <Text className="text-gray-300 text-sm font-semibold mb-2">
                Password Requirements:
              </Text>
              <Text
                className={`text-xs mb-1 ${password.length >= 8 ? "text-green-400" : "text-gray-400"}`}
              >
                • At least 8 characters
              </Text>
              <Text
                className={`text-xs mb-1 ${/[A-Z]/.test(password) ? "text-green-400" : "text-gray-400"}`}
              >
                • At least one uppercase letter
              </Text>
              <Text
                className={`text-xs mb-1 ${/[a-z]/.test(password) ? "text-green-400" : "text-gray-400"}`}
              >
                • At least one lowercase letter
              </Text>
              <Text
                className={`text-xs ${/[0-9]/.test(password) ? "text-green-400" : "text-gray-400"}`}
              >
                • At least one number
              </Text>
            </View>

            <PrimaryButton
              title={submitButtonText}
              onPress={handleResetPassword}
              disabled={isSubmitDisabled}
              loading={isSubmitDisabled}
            />
          </View>

          {/* Footer */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-400 text-sm">
              Remember your password?{" "}
            </Text>
            <TouchableOpacity onPress={handleBack}>
              <Text className="text-blue-300 text-sm font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </LinearGradient>
  );
}
