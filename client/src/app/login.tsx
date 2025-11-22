import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../config/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});

    try {

      await login(email, password);
      router.replace("/");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Handle specific error cases
      if (errorMessage.includes('user not found') || errorMessage.includes('invalid credentials')) {
        setErrors({
          email: 'Invalid email or password',
          password: 'Invalid email or password'
        });
      } else if (errorMessage.includes('network')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection.'
        );
      } else {
        Alert.alert('Login Failed', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = () => {
    router.push("/signup");
  };

  return (
    <LinearGradient colors={theme.background.gradient} className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-7 justify-center">
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-full bg-white/5 justify-center items-center mb-5 border border-white/10">
              <Text className="text-white font-bold text-3xl">T</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-200 ">
              Welcome Back !!
            </Text>
            <Text className="text-base text-gray-400 text-center">
              Sign in to your account
            </Text>
          </View>

          <View className="mb-8">
            <View className={`flex-row items-center bg-gray-800 rounded-xl mb-1 px-4 h-14 border ${errors.email ? 'border-red-500' : 'border-gray-700'}`}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={errors.email ? '#EF4444' : '#9CA3AF'} 
              />
              <TextInput
                className="flex-1 text-base text-gray-200 ml-3"
                placeholder="Email"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text className="text-red-400 text-xs mb-2 ml-1">{errors.email}</Text>}

            <View className={`flex-row items-center bg-gray-800 rounded-xl mb-1 px-4 h-14 border ${errors.password ? 'border-red-500' : 'border-gray-700'}`}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={errors.password ? '#EF4444' : '#9CA3AF'} 
              />
              <TextInput
                className="flex-1 text-base text-gray-200 ml-3"
                placeholder="Password"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="p-1"
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={errors.password ? '#EF4444' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text className="text-red-400 text-xs mb-2 ml-1">{errors.password}</Text>}

            <TouchableOpacity className="self-end mb-6">
              <Text className="text-blue-300 text-sm font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`rounded-xl h-14 justify-center items-center mb-5 ${isLoading || isSubmitting ? "bg-blue-600 opacity-70" : "bg-blue-600"}`}
              onPress={handleLogin}
              disabled={isLoading || isSubmitting}
            >
              <Text className="text-white text-base font-bold">
                {isLoading || isSubmitting ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center mb-5">
              <View className="flex-1 h-px bg-white/10" />
              <Text className="text-gray-400 mx-4 text-sm">OR</Text>
              <View className="flex-1 h-px bg-white/10" />
            </View>

            <TouchableOpacity className="flex-row items-center justify-center bg-gray-900 rounded-xl h-14 px-4 border border-gray-700">
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text className="text-gray-200 text-base font-medium ml-3">
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

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
