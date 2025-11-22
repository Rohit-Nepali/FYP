import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../config/theme";

const { width, height } = Dimensions.get("window");

export default function SignupScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the Terms and Conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for the field being edited
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      await register(fullName, formData.email, formData.password);
      
      Alert.alert(
        "Success", 
        "Account created successfully!",
        [{ text: "OK", onPress: () => router.replace("/") }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      if (errorMessage.includes('email') && errorMessage.includes('taken')) {
        setErrors(prev => ({
          ...prev,
          email: 'This email is already registered. Please use a different email or sign in.'
        }));
      } else if (errorMessage.includes('network')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection.'
        );
      } else {
        Alert.alert('Signup Failed', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  return (
    <LinearGradient colors={theme.background.gradient} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>PA</Text>
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join us and boost your productivity
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={theme.input.icon}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input, 
                      errors.firstName && styles.inputError
                    ]}
                    placeholder="First Name"
                    placeholderTextColor={errors.firstName ? '#FCA5A5' : theme.input.placeholder}
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange("firstName", value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  {errors.firstName && (
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  )}
                </View>

                <View style={[styles.inputContainer, styles.halfInput]}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={theme.input.icon}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input, 
                      errors.lastName && styles.inputError
                    ]}
                    placeholder="Last Name"
                    placeholderTextColor={errors.lastName ? '#FCA5A5' : theme.input.placeholder}
                    value={formData.lastName}
                    onChangeText={(value) => handleInputChange("lastName", value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  {errors.lastName && (
                    <Text style={styles.errorText}>{errors.lastName}</Text>
                  )}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.input.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input, 
                    errors.email && styles.inputError
                  ]}
                  placeholder="Email"
                  placeholderTextColor={errors.email ? '#FCA5A5' : theme.input.placeholder}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.input.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input, 
                    errors.password && styles.inputError
                  ]}
                  placeholder="Password"
                  placeholderTextColor={errors.password ? '#FCA5A5' : theme.input.placeholder}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={theme.input.icon}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.input.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input, 
                    errors.confirmPassword && styles.inputError
                  ]}
                  placeholder="Confirm Password"
                  placeholderTextColor={errors.confirmPassword ? '#FCA5A5' : theme.input.placeholder}
                  value={formData.confirmPassword}
                  onChangeText={(value) =>
                    handleInputChange("confirmPassword", value)
                  }
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              >
                <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    errors.terms && !agreeToTerms && styles.checkboxError
                  ]}
                  onPress={() => {
                    setAgreeToTerms(!agreeToTerms);
                    if (errors.terms) {
                      setErrors(prev => ({
                        ...prev,
                        terms: undefined
                      }));
                    }
                  }}
                >
                  {agreeToTerms && (
                    <Ionicons name="checkmark" size={16} color="#3B82F6" />
                  )}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms and Conditions</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
              {errors.terms && (
                <Text style={[styles.errorText, { marginTop: 4 }]}>{errors.terms}</Text>
              )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.signupButton,
                  (isLoading || isSubmitting) && styles.signupButtonDisabled,
                ]}
                onPress={handleSignUp}
                disabled={isLoading || isSubmitting}
              >
                <Text style={styles.signupButtonText}>
                  {isLoading || isSubmitting ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleButton}>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.googleButtonText}>
                  Continue with Google
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleSignIn}>
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  checkboxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 40,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.card.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.card.border,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: theme.text.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.text.secondary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.text.tertiary,
    textAlign: "center",
  },
  form: {
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  halfInput: {
    width: "48%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.input.background,
    borderRadius: theme.radius.md,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: theme.input.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.input.text,
  },
  eyeIcon: {
    padding: 4,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.border.primary,
    marginRight: 12,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.button.primary.background,
    borderColor: theme.button.primary.background,
  },
  termsText: {
    flex: 1,
    color: theme.text.tertiary,
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: theme.text.link,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  signupButton: {
    backgroundColor: theme.button.primary.background,
    borderRadius: theme.radius.md,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: theme.button.primary.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.divider.line,
  },
  dividerText: {
    color: theme.divider.text,
    marginHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.button.secondary.background,
    borderRadius: theme.radius.md,
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.button.secondary.border,
  },
  googleButtonText: {
    color: theme.button.secondary.text,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: theme.text.tertiary,
    fontSize: 14,
  },
  signInText: {
    color: theme.text.link,
    fontSize: 14,
    fontWeight: "bold",
  },
});
