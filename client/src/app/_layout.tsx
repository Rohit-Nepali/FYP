import { Stack, usePathname } from "expo-router";
import "../../global.css";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomNavigation } from "../components/BottomNavigation";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { View } from "react-native";

// Wrapper component to conditionally show bottom nav
function AppLayout() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { bottom } = useSafeAreaInsets();

  // Pages that should NOT show bottom navigation
  const noNavPages = ["/login", "/signup", "/splash"];
  const showBottomNav = isAuthenticated && !noNavPages.includes(pathname);

  const navHeight = 50;
  const bottomInset = showBottomNav ? bottom + navHeight : bottom;

  return (
    <View style={{ flex: 1, backgroundColor: "#111827", paddingBottom: bottomInset }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 100,
          contentStyle: {
            backgroundColor: "#111827",
          },
        }}
      >
        {/* public routes */}
        <Stack.Screen name="splash" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />

        {/* protected routes */}
        <Stack.Screen name="chatbot" />
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="task-settings" />
        <Stack.Screen name="projects/page" />
        < Stack.Screen name="settings/AccountSettings" />
        < Stack.Screen name="settings/PrivacySecurity" />
        <Stack.Screen name="settings/HelpSupport" />
        <Stack.Screen name="settings/About" />
        <Stack.Screen name="settings/EditProfile" />
      </Stack>

      {showBottomNav && (<View style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: navHeight + bottom,
      }}>
        <BottomNavigation />
      </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
