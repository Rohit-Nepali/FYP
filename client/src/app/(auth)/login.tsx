import React, { useCallback, useMemo, useState } from "react";
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
import { theme } from "../../config/theme";
import { FormInput } from "@/src/components/common/FormInput";
import { PrimaryButton } from "@/src/components/UI/Buttons";
import { CustomAlert } from "@/src/components/UI/CustomAlert";
import { useLoginForm } from "../../hooks/useLoginForm";
import { handleAuthError, getAuthErrorMessage } from "../../utils/errorHandler";
import { signInWithGoogle } from "../../services/googleAuthService";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthChecking, setUserFromGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<
    "default" | "success" | "error" | "warning" | "info"
  >("default");

  // Google Sign-In loading state

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
        showAlert(errorInfo.title, errorInfo.message, "error");
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

  // Handle Google Sign-In
  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      // Sync AuthContext with the user from Google Sign-In
      setUserFromGoogle({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: 'user', // Default role for Google sign-in users
        profileImage: result.user.picture,
        createdAt: new Date().toISOString(),
      });
      router.replace("/");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to sign in with Google";
      showAlert("Google Sign-In Failed", errorMessage, "error");
    } finally {
      setIsGoogleLoading(false);
    }
  }, [router, setUserFromGoogle]);

  // Memoized computed values
  const isSubmitDisabled = useMemo(
    () => isAuthChecking || isSubmitting,
    [isAuthChecking, isSubmitting]
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

            <TouchableOpacity
              onPress={() => router.push("/forgot-password")}
              className="self-end mb-6"
            >
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
              title={isGoogleLoading ? "Signing in with Google..." : "Continue with Google"}
              onPress={handleGoogleSignIn}
              variant="secondary"
              icon={googleIcon}
              loading={isGoogleLoading}
              disabled={isGoogleLoading}
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
