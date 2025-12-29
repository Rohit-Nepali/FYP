import React, { ReactNode, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { usePathname, useRouter } from "expo-router";

interface ProtectedRouteProps {
  children: ReactNode;
}

const PUBLIC_PATHS = ["/login", "/signup", "/splash", "/verify-email", "/forgot-password", "/verify-reset-token"] as const;

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = useMemo(() => {
    return PUBLIC_PATHS.includes(pathname as typeof PUBLIC_PATHS[number]);
  }, [pathname]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublicPath) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && isPublicPath) {
      router.replace("/");
      return;
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  // Prevent flash of protected content before redirect
  if (!isAuthenticated && !isPublicPath) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    )
  }

  // Prevent flash of public pages for authenticated users
  if (isAuthenticated && isPublicPath) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return <>{children}</>;
};
