import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { theme } from "../../config/theme";
import { FormInput } from "@/src/components/common/FormInput";
import { PrimaryButton } from "@/src/components/UI/Buttons";
import { useLoginForm } from "../../hooks/useLoginForm";
import { handleAuthError, getAuthErrorMessage } from "../../utils/errorHandler";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  // Use our custom hook for form state management
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    errors,
    setErrors,
    isSubmitting,
    setIsSubmitting,
    clearError,
    togglePasswordVisibility,
  } = useLoginForm();

  // Memoized validation function
  const validateForm = useCallback(() => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, setErrors]);

  // Memoized login handler
  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(email, password);
      router.replace("/");
    } catch (error) {
      const errorType = handleAuthError(error);
      const errorInfo = getAuthErrorMessage(errorType);

      if (errorType === "INVALID_CREDENTIALS") {
        setErrors({
          email: "Invalid email or password",
          password: "Invalid email or password",
        });
      } else {
        Alert.alert(errorInfo.title, errorInfo.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    email,
    password,
    validateForm,
    login,
    router,
    setErrors,
    setIsSubmitting,
  ]);

  // Memoized input change handlers
  const handleEmailChange = useCallback(
    (text: string) => {
      setEmail(text);
      if (errors.email) {
        clearError("email");
      }
    },
    [errors.email, setEmail, clearError]
  );

  const handlePasswordChange = useCallback(
    (text: string) => {
      setPassword(text);
      if (errors.password) {
        clearError("password");
      }
    },
    [errors.password, setPassword, clearError]
  );

  const handleSignUp = useCallback(() => {
    router.push("/signup");
  }, [router]);

  // Memoized computed values
  const isSubmitDisabled = useMemo(
    () => isLoading || isSubmitting,
    [isLoading, isSubmitting]
  );

  const submitButtonText = useMemo(
    () => (isSubmitDisabled ? "Signing In..." : "Sign In"),
    [isSubmitDisabled]
  );

  const googleIcon = useMemo(
    () => <Ionicons name="logo-google" size={20} color="#DB4437" />,
    []
  );

  return (
    <LinearGradient colors={theme.background.gradient} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-8 justify-center">
          {/* Header Section */}
          <View className="items-center mb-10">
            <View className="w-24 h-24 mb-4">
              <Image
                source={require("../../../assets/images/logo.png")}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
            <Text className="text-2xl font-bold text-gray-200">
              Welcome Back!
            </Text>
            <Text className="text-base text-gray-400 text-center">
              Sign in to your account
            </Text>
          </View>

          {/* Form Section */}
          <View className="mb-8">
            <FormInput
              icon="mail-outline"
              placeholder="Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              error={errors.email}
            />

            <FormInput
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              showPasswordToggle
              isPasswordVisible={showPassword}
              onTogglePassword={togglePasswordVisibility}
              error={errors.password}
            />

            <TouchableOpacity className="self-end mb-6">
              <Text className="text-blue-300 text-sm font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <PrimaryButton
              title={submitButtonText}
              onPress={handleLogin}
              disabled={isSubmitDisabled}
              loading={isSubmitDisabled}
            />

            {/* Divider */}
            <View className="flex-row items-center my-5">
              <View className="flex-1 h-px bg-white/10" />
              <Text className="text-gray-400 mx-4 text-sm">OR</Text>
              <View className="flex-1 h-px bg-white/10" />
            </View>

            {/* Social Login */}
            <PrimaryButton
              title="Continue with Google"
              onPress={() => {
                // Add Google login logic here
                Alert.alert(
                  "Coming Soon",
                  "Google login will be available soon!"
                );
              }}
              variant="secondary"
              icon={googleIcon}
            />
          </View>

          {/* Footer */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-400 text-sm">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text className="text-blue-300 text-sm font-bold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
