import '../config/firebase';
import { Stack, usePathname, useRouter } from "expo-router";
import "../../global.css";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomNavigation } from "../components/BottomNavigation";
import { ActivityIndicator, View } from "react-native";
import { useEffect } from "react";
import { NotificationProvider } from "../providers/NotificationProvider";
import { registerBackgroundHandler } from "../firebase/backgroundMessaging";

export default function RootLayout() {

  useEffect(() => {
    registerBackgroundHandler();
  }, [])

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppLayout />
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// Update AppLayout to handle protection per-screen
function AppLayout() {
  const pathname = usePathname();
  const { isAuthenticated, isAuthChecking } = useAuth();
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();

  // Pages that should NOT show bottom navigation
  const noNavPages = ["/login", "/signup", "/splash"];
  const showBottomNav = isAuthenticated && !noNavPages.includes(pathname);

  const navHeight = 50;
  const bottomInset = showBottomNav ? bottom + navHeight : bottom;

  // Handle redirects after Stack is mounted
  useEffect(() => {
    if (isAuthChecking) return;

    const isPublicPath = ["/login", "/signup", "/splash", "/verify-email", "/forgot-password", "/verify-reset-token"].includes(pathname);

    if (!isAuthenticated && !isPublicPath) {
      router.replace("/login");
    } else if (isAuthenticated && isPublicPath && pathname !== "/splash") {
      router.replace("/"); // or your home route
    }
  }, [isAuthenticated, isAuthChecking, pathname]);

  // Show loading during auth check
  if (isAuthChecking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111827" }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

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
        <Stack.Screen name="splash" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="chatbot" />
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="task-settings" />
        <Stack.Screen name="projects/page" />
        <Stack.Screen name="settings/AccountSettings" />
        <Stack.Screen name="settings/PrivacySecurity" />
        <Stack.Screen name="settings/HelpSupport" />
        <Stack.Screen name="settings/About" />
        <Stack.Screen name="settings/EditProfile" />
      </Stack>

      {showBottomNav && (
        <View style={{
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