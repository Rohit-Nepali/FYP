import { useRouter, usePathname } from "expo-router";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: "Home", icon: "home" as const, route: "/" as const },
    {
      name: "Tasks",
      icon: "checkmark-done" as const,
      route: "/tasks" as const,
    },
    {
      name: "Chatbot",
      icon: "chatbubble-ellipses" as const,
      route: "/chatbot" as const,
    },
    {
      name: "Profile",
      icon: "person" as const,
      route: "/profile" as const
    },
  ];

  const getActiveTab = () => {
    if (pathname === "/") return "home";
    
    // Check if we're in the profile or settings section
    const normalizedPath = pathname.toLowerCase();
    if (normalizedPath.includes("/profile") || normalizedPath.includes("/settings")) {
      return "profile";
    }
    
    return pathname.replace("/", "").toLowerCase() || "home";
  };

  const activeTab = getActiveTab();

  return (
    <LinearGradient
      colors={["#111827", "#0B0F14"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="absolute bottom-0 left-0 right-0 border-t border-gray-700/50"
    >
      <View className="flex-row justify-around py-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name.toLowerCase();

          return (
            <TouchableOpacity
              key={tab.name}
              className="items-center justify-center py-2 flex-1 gap-1"
              onPress={() => {
                if (pathname !== tab.route) {
                  router.replace(tab.route);
                }
              }}
            >
              <View
                className={`w-10 h-10 rounded-lg items-center justify-center transition-all ${
                  isActive ? "bg-purple-500/20 border border-purple-500/40" : "bg-transparent"
                }`}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={24}
                  color={isActive ? "#a78bfa" : "#6b7280"}
                />
              </View>
              <Text
                className={`text-xs font-medium ${
                  isActive ? "text-purple-400" : "text-gray-500"
                }`}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </LinearGradient>
  );
}
