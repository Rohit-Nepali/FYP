import React, { useCallback, useMemo, useState } from "react";
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

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState<{ code?: string }>({});

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<
    "default" | "success" | "error" | "warning" | "info"
  >("default");
  const [onAlertConfirm, setOnAlertConfirm] = useState<(() => void) | undefined>(
    undefined
  );

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      type: "default" | "success" | "error" | "warning" | "info" = "default",
      onConfirm?: () => void
    ) => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertType(type);
      setOnAlertConfirm(() => onConfirm);
      setAlertVisible(true);
    },
    []
  );

  const validateForm = useCallback(() => {
    const newErrors: { code?: string } = {};

    if (!code.trim()) {
      newErrors.code = "Verification code is required";
    } else if (!/^\d{6}$/.test(code.trim())) {
      newErrors.code = "Enter a valid 6-digit code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [code]);

  const handleVerifyEmail = useCallback(async () => {
    if (!email) {
      showAlert("Error", "Missing email. Please sign up again.", "error", () => {
        router.replace("/signup");
      });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await authService.verifyEmail(email, code.trim());
      showAlert(
        "Success",
        result.alreadyVerified
          ? "Email already verified. Please sign in."
          : "Email verified successfully. Please sign in.",
        "success",
        () => router.replace("/login")
      );
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to verify email";
      showAlert("Verification Failed", errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [email, code, validateForm, router, showAlert]);

  const handleResendCode = useCallback(async () => {
    if (!email) {
      showAlert("Error", "Missing email. Please sign up again.", "error", () => {
        router.replace("/signup");
      });
      return;
    }

    setIsResending(true);
    try {
      const result = await authService.resendVerification(email);
      showAlert(
        "Verification Code",
        result.alreadyVerified
          ? "This email is already verified. Please sign in."
          : "A new verification code has been sent to your email.",
        "info"
      );
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to resend verification code";
      showAlert("Error", errorMessage, "error");
    } finally {
      setIsResending(false);
    }
  }, [email, router, showAlert]);

  const handleCodeChange = useCallback(
    (text: string) => {
      setCode(text);
      if (errors.code) {
        setErrors({});
      }
    },
    [errors.code]
  );

  const isSubmitDisabled = useMemo(
    () => isSubmitting || isResending,
    [isSubmitting, isResending]
  );

  const verifyButtonText = useMemo(() => {
    if (isSubmitting) return "Verifying...";
    if (isResending) return "Please wait...";
    return "Verify Email";
  }, [isSubmitting, isResending]);

  return (
    <LinearGradient colors={theme.background.gradient} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-8 justify-center">
          <TouchableOpacity
            onPress={() => router.replace("/signup")}
            className="absolute top-12 left-6 z-10"
          >
            <Ionicons name="arrow-back" size={24} color={theme.text.secondary} />
          </TouchableOpacity>

          <View className="items-center mb-10">
            <Ionicons name="mail-outline" size={48} color="#64748b" />
            <Text className="text-2xl font-bold text-gray-200 mt-4 mb-2">
              Verify Your Email
            </Text>
            <Text className="text-base text-gray-400 text-center">
              Enter the 6-digit code sent to {email || "your email"}.
            </Text>
          </View>

          <View className="mb-8">
            <FormInput
              icon="key-outline"
              placeholder="Enter 6-digit code"
              value={code}
              onChangeText={handleCodeChange}
              error={errors.code}
              keyboardType="numeric"
              autoCapitalize="none"
            />

            <PrimaryButton
              title={verifyButtonText}
              onPress={handleVerifyEmail}
              disabled={isSubmitDisabled}
              loading={isSubmitDisabled && isSubmitting}
            />

            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isResending || isSubmitting}
              className="items-center mt-4"
            >
              <Text className="text-blue-300 text-sm font-bold">
                {isResending ? "Resending..." : "Resend code"}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center items-center">
            <Text className="text-gray-400 text-sm">Already verified? </Text>
            <TouchableOpacity onPress={() => router.replace("/login")}>
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
        onClose={() => {
          setAlertVisible(false);
          setOnAlertConfirm(undefined);
        }}
        onConfirm={onAlertConfirm}
      />
    </LinearGradient>
  );
}
