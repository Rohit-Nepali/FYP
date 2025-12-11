import { Stack, usePathname } from "expo-router";
import "../../global.css";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomNavigation } from "../components/BottomNavigation";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../config/theme";

// Wrapper component to conditionally show bottom nav
function AppLayout() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Pages that should NOT show bottom navigation
  const noNavPages = ["/login", "/signup", "/splash"];
  const showBottomNav = isAuthenticated && !noNavPages.includes(pathname);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 100,
        }}
      >
        <Stack.Screen name="splash" />
        <Stack.Screen name="index" />
        <Stack.Screen name="chatbot" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="tasks/tasks" />
        <Stack.Screen name="groups/index" />
        <Stack.Screen name="groups/[id]" />
        <Stack.Screen name="tasks/group/[groupId]" />
      </Stack>
      {showBottomNav && <BottomNavigation />}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
