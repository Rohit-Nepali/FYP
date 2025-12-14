import React, { ReactNode } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import path from "path";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Define public paths that don't require authentication
  const publicPaths = ["/login", "/signup", "/splash"];
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !publicPaths.includes(pathname)) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text>Loading...</Text>
      </View>
    );
  }

  // Allow public pages to render even if not authenticated
  if (!isAuthenticated && publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  // Authenticated user
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return null;
};
