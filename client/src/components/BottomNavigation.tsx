import { useRouter, usePathname } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: "Home", icon: "home" as const, route: "/" as const },
    { name: "Tasks", icon: "list" as const, route: "/tasks" as const },
    { name: "Profile", icon: "person" as const, route: "/profile" as const },
    {
      name: "Chat",
      icon: "chatbubble-ellipses" as const,
      route: "/chatbot" as const,
    },
  ];

  const getActiveTab = () => {
    if (pathname === "/") return "home";
    return pathname.replace("/", "").toLowerCase() || "home";
  };

  const activeTab = getActiveTab();

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
      <View className="flex-row justify-around py-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name.toLowerCase();
          return (
            <TouchableOpacity
              key={tab.name}
              className="items-center justify-center py-2 flex-1"
              onPress={() => router.push(tab.route)}
            >
              <Ionicons
                name={tab.icon as any}
                size={24}
                color={isActive ? "#8b5cf6" : "#6b7280"}
              />
              <Text
                className={`text-xs mt-1 ${
                  isActive ? "text-purple-400" : "text-gray-500"
                }`}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
