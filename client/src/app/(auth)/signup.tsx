import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { theme } from "../../config/theme";
import { FormInput } from "@/src/components/common/FormInput";
import { PrimaryButton } from "@/src/components/UI/Buttons";
import { Checkbox } from "@/src/components/UI/CheckBox";
import { useSignupForm } from "../../hooks/useSignupForm";
import {
  handleSignupError,
  getSignupErrorMessage,
} from "../../utils/errorHandler";
import { validateField, signupValidationRules } from "../../utils/validation";

export default function SignupScreen() {
  const router = useRouter();
  const { register, isAuthChecking } = useAuth();

  // Use our custom hook for form state management
  const {
    formData,
    showPassword,
    showConfirmPassword,
    agreeToTerms,
    errors,
    isSubmitting,
    updateFormData,
    clearError,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    toggleAgreeToTerms,
    setErrors,
    setIsSubmitting,
  } = useSignupForm();

  // Memoized validation function
  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};

    // Validate each field
    const firstNameError = validateField(
      formData.firstName,
      signupValidationRules.firstName,
      "First name"
    );
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateField(
      formData.lastName,
      signupValidationRules.lastName,
      "Last name"
    );
    if (lastNameError) newErrors.lastName = lastNameError;

    const emailError = validateField(
      formData.email,
      signupValidationRules.email,
      "Email"
    );
    if (emailError) newErrors.email = emailError;

    const passwordError = validateField(
      formData.password,
      signupValidationRules.password,
      "Password"
    );
    if (passwordError) newErrors.password = passwordError;

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms validation
    if (!agreeToTerms) {
      newErrors.terms = "You must agree to the Terms and Conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, agreeToTerms, setErrors]);

  // Memoized input change handlers
  const handleInputChange = useCallback(
    (field: string, value: string) => {
      updateFormData(field, value);
      if (errors[field as keyof typeof errors]) {
        clearError(field as keyof typeof errors);
      }
    },
    [errors, updateFormData, clearError]
  );

  // Specific handlers for better performance
  const handleFirstNameChange = useCallback(
    (value: string) => {
      handleInputChange("firstName", value);
    },
    [handleInputChange]
  );

  const handleLastNameChange = useCallback(
    (value: string) => {
      handleInputChange("lastName", value);
    },
    [handleInputChange]
  );

  const handleEmailChange = useCallback(
    (value: string) => {
      handleInputChange("email", value);
    },
    [handleInputChange]
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      handleInputChange("password", value);
    },
    [handleInputChange]
  );

  const handleConfirmPasswordChange = useCallback(
    (value: string) => {
      handleInputChange("confirmPassword", value);
    },
    [handleInputChange]
  );

  // Memoized signup handler
  const handleSignUp = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      await register(fullName, formData.email, formData.password);

      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    } catch (error) {
      const errorType = handleSignupError(error);
      const errorInfo = getSignupErrorMessage(errorType);

      if (errorType === "EMAIL_TAKEN") {
        setErrors((prev) => ({
          ...prev,
          email: errorInfo.message,
        }));
      } else {
        Alert.alert(errorInfo.title, errorInfo.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, register, router, setErrors, setIsSubmitting]);

  const handleSignIn = useCallback(() => {
    router.push("/login");
  }, [router]);

  // Memoized computed values
  const isSubmitDisabled = useMemo(
    () => isAuthChecking || isSubmitting,
    [isAuthChecking, isSubmitting]
  );

  const submitButtonText = useMemo(
    () => (isSubmitDisabled ? "Creating Account..." : "Sign Up"),
    [isSubmitDisabled]
  );

  const checkboxLabel = useMemo(
    () => (
      <Text className="text-xs text-gray-500 leading-4">
        I agree to the{" "}
        <Text className="text-blue-500 font-bold underline">
          Terms and Conditions
        </Text>{" "}
        and{" "}
        <Text className="text-blue-500 font-bold underline">
          Privacy Policy
        </Text>
      </Text>
    ),
    []
  );

  return (
    <LinearGradient colors={theme.background.gradient} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-8 py-10 justify-center">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 mb-4">
                <Image
                  source={require("../../../assets/images/logo.png")}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-2xl font-bold text-gray-700 mb-2">
                Create Account
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                Join us and boost your productivity
              </Text>
            </View>

            {/* Form */}
            <View className="mb-5">
              {/* Name Row */}
              <View className="flex-row justify-between mb-4">
                <View className="w-[48%]">
                  <FormInput
                    icon="person-outline"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChangeText={handleFirstNameChange}
                    error={errors.firstName}
                    autoCapitalize="words"
                  />
                </View>

                <View className="w-[48%]">
                  <FormInput
                    icon="person-outline"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChangeText={handleLastNameChange}
                    error={errors.lastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email */}
              <FormInput
                icon="mail-outline"
                placeholder="Email"
                value={formData.email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                error={errors.email}
                autoCapitalize="none"
              />

              {/* Password */}
              <FormInput
                icon="lock-closed-outline"
                placeholder="Password"
                value={formData.password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                showPasswordToggle
                isPasswordVisible={showPassword}
                onTogglePassword={togglePasswordVisibility}
                error={errors.password}
                autoCapitalize="none"
              />

              {/* Confirm Password */}
              <FormInput
                icon="lock-closed-outline"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry
                showPasswordToggle
                isPasswordVisible={showConfirmPassword}
                onTogglePassword={toggleConfirmPasswordVisibility}
                error={errors.confirmPassword}
                autoCapitalize="none"
              />

              {/* Terms and Conditions */}
              <Checkbox
                label={checkboxLabel}
                checked={agreeToTerms}
                onToggle={toggleAgreeToTerms}
                error={errors.terms}
                required
              />

              {/* Sign Up Button */}
              <PrimaryButton
                title={submitButtonText}
                onPress={handleSignUp}
                disabled={isSubmitDisabled}
                loading={isSubmitDisabled}
              />

              {/* Divider */}
              <View className="flex-row items-center my-5">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="text-gray-500 mx-4 text-sm">OR</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Google Button */}
              <PrimaryButton
                title="Continue with Google"
                onPress={() => {
                  Alert.alert(
                    "Coming Soon",
                    "Google signup will be available soon!"
                  );
                }}
                variant="secondary"
                icon="logo-google"
              />
            </View>

            {/* Footer */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-500 text-sm">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={handleSignIn}>
                <Text className="text-blue-500 text-sm font-bold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
