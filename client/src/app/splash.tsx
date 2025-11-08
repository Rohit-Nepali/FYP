import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../config/theme";

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace("/");
        } else {
          router.replace("/login");
        }
      }, 2000); // Show splash for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <LinearGradient
      colors={theme.background.gradient}
      className="flex-1 justify-center items-center"
    >
      <View className="flex-1 justify-center items-center">
        <View className="mb-10">
          <View
            className="w-30 h-30 rounded-full bg-white/10 justify-center items-center border-2 border-white/20"
            style={{ width: 120, height: 120, borderRadius: 60 }}
          >
            <Text
              className="font-bold"
              style={{ fontSize: 48, color: theme.text.primary }}
            >
              PA
            </Text>
          </View>
        </View>

        <Text
          className="text-3xl font-bold mb-2 text-center"
          style={{ color: theme.text.secondary }}
        >
          ProductivityApp
        </Text>
        <Text
          className="text-base text-center mb-15"
          style={{ color: theme.text.tertiary }}
        >
          Boost Your Productivity
        </Text>

        <View className="w-3/5 items-center">
          <View
            className="w-full h-1 rounded"
            style={{ backgroundColor: theme.divider.line }}
          />
        </View>
      </View>
    </LinearGradient>
  );
}
