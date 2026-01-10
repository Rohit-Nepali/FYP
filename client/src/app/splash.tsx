import React, { useEffect } from "react";
import { View, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../config/theme";

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isAuthChecking } = useAuth();

  useEffect(() => {
    if (!isAuthChecking) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace("/");
        } else {
          router.replace("/login");
        }
      }, 2000); // Show splash for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [isAuthChecking, isAuthenticated, router]);

  return (
    <LinearGradient
      colors={theme.background.gradient}
      className="flex-1 justify-center items-center"
    >
      <View className="flex-1 justify-center items-center">
        <View className="mb-10">
          <View className="flex-1 items-center justify-center">
            {/* add logo  here */}
            <View className="w-24 h-24">
              <Image
                source={require("../../assets/images/logo.png")}
                className="w-full h-full "
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

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
