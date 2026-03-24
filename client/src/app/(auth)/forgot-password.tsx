import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../config/theme";
import { FormInput } from "@/src/components/common/FormInput";
import { PrimaryButton } from "@/src/components/UI/Buttons";
import { CustomAlert } from "@/src/components/UI/CustomAlert";
import { authService } from "../../services/authService";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

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
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email]);

  // Handle forgot password
  const handleForgotPassword = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await authService.forgotPassword(email);
      showAlert(
        "Success",
        "If an account exists for this email, a password reset code has been sent. Please check your inbox.",
        "success"
      );

      // Redirect to reset password screen after a delay
      setTimeout(() => {
        router.push({
          pathname: "/verify-reset-token",
          params: { email },
        });
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to process forgot password request";

      showAlert("Error", errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [email, validateForm, router]);

  // Handle email change
  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      if (errors.email) {
        setErrors({});
      }
    },
    [errors.email]
  );

  // Handle back
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Memoized button state
  const isSubmitDisabled = useMemo(
    () => isSubmitting,
    [isSubmitting]
  );

  const submitButtonText = useMemo(
    () => (isSubmitDisabled ? "Sending..." : "Send OTP"),
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
            <Text className="text-2xl font-bold text-gray-200 mb-2">
              Forgot Password?
            </Text>
            <Text className="text-base text-gray-400 text-center">
              No worries! Enter your email and we'll send you a one-time code (OTP) to reset your password.
            </Text>
          </View>

          {/* Form Section */}
          <View className="mb-8">
            <FormInput
              icon="mail-outline"
              placeholder="Enter your email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              error={errors.email}
            />

            <PrimaryButton
              title={submitButtonText}
              onPress={handleForgotPassword}
              disabled={isSubmitDisabled}
              loading={isSubmitDisabled}
            />
          </View>

          {/* Footer */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-400 text-sm">Remember your password? </Text>
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
