import { Stack, usePathname } from "expo-router";
import "../../global.css";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomNavigation } from "../components/BottomNavigation";
import { View } from "react-native";

// Wrapper component to conditionally show bottom nav
function AppLayout() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Pages that should NOT show bottom navigation
  const noNavPages = ["/login", "/signup", "/splash"];
  const showBottomNav = isAuthenticated && !noNavPages.includes(pathname);

  return (
    <>
      <Stack>
        <Stack.Screen
          name="splash"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="tasks"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chatbot"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="groups/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="groups/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="tasks/group/[groupId]"
          options={{
            headerShown: false,
          }}
        />
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
