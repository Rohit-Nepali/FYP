import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000); // Show splash for 3 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View className="flex-1 justify-center items-center bg-gradient-to-br from-blue-500 to-purple-600">
      <View className="items-center justify-center flex-1">
        <View className="mb-10">
          <View className="w-30 h-30 rounded-full bg-white/20 justify-center items-center border-3 border-white/30">
            <Text className="text-5xl font-bold text-white">PA</Text>
          </View>
        </View>

        <Text className="text-4xl font-bold text-white mb-2 text-center">
          ProductivityApp
        </Text>
        <Text className="text-base text-white/80 text-center mb-15">
          Boost Your Productivity
        </Text>

        <View className="w-3/5 items-center">
          <View className="w-full h-1 bg-white/30 rounded overflow-hidden">
            <View className="h-full w-full bg-white rounded" />
          </View>
        </View>
      </View>
    </View>
  );
}
