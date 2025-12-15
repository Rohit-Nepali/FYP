import React, { useCallback, useState, useMemo } from "react";
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

export default function VerifyResetTokenScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  // Form state
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ token?: string }>({});

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

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors: { token?: string } = {};

    if (!token.trim()) {
      newErrors.token = "Reset token is required";
    } else if (token.length < 10) {
      newErrors.token = "Invalid token format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [token]);

  // Handle verify token
  const handleVerifyToken = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await authService.verifyResetToken(token);
      showAlert(
        "Success",
        "Token verified! Proceed to reset your password.",
        "success"
      );

      // Redirect to reset password screen
      setTimeout(() => {
        router.push({
          pathname: "/reset-password",
          params: { token, email },
        });
      }, 1500);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to verify reset token";

      showAlert("Error", errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [token, validateForm, router, email]);

  // Handle token change
  const handleTokenChange = useCallback(
    (text: string) => {
      setToken(text);
      if (errors.token) {
        setErrors({});
      }
    },
    [errors.token]
  );

  // Handle back
  const handleBack = useCallback(() => {
    router.push("/login");
  }, [router]);

  // Memoized button state
  const isSubmitDisabled = useMemo(() => isSubmitting, [isSubmitting]);

  const submitButtonText = useMemo(
    () => (isSubmitDisabled ? "Verifying..." : "Verify Token"),
    [isSubmitDisabled]
  );

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
            <Ionicons name="mail-outline" size={48} color="#64748b" />
            <Text className="text-2xl font-bold text-gray-200 mt-4 mb-2">
              Verify Your Email
            </Text>
            <Text className="text-base text-gray-400 text-center">
              We've sent a verification code to {email || "your email"}. Enter
              it below to reset your password.
            </Text>
          </View>

          {/* Form Section */}
          <View className="mb-8">
            <FormInput
              icon="key-outline"
              placeholder="Enter reset token"
              value={token}
              onChangeText={handleTokenChange}
              error={errors.token}
              autoCapitalize="none"
            />

            <PrimaryButton
              title={submitButtonText}
              onPress={handleVerifyToken}
              disabled={isSubmitDisabled}
              loading={isSubmitDisabled}
            />

            {/* Info Section */}
            <View className="bg-blue-500/10 rounded-lg p-4 mt-6 border border-blue-500/20">
              <Text className="text-gray-300 text-xs text-center">
                The reset token will be provided in the email sent to your
                registered email address.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-400 text-sm">
              Didn't receive the token?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => {
                router.push("/forgot-password");
              }}
            >
              <Text className="text-blue-300 text-sm font-bold">Try again</Text>
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
