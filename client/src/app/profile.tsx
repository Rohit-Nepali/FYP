import React, { useState, useEffect } from "react";
import {
  AppState,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
  Image,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/src/components/UI/Buttons";
import { resolveFileUrl } from "@/src/utils/url";
import { axiosInstance } from "@/src/services/authService";
import {
  getFcmToken,
  hasNotificationPermission,
  requestFirebasePermission,
} from "@/src/services/notificationService";
import { updateDigestPreferences } from "@/src/services/userService";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isNotificationToggleBusy, setIsNotificationToggleBusy] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const syncNotificationState = async () => {
      try {
        const enabled = await hasNotificationPermission();
        if (isMounted) {
          setNotificationsEnabled(enabled);
        }
      } catch (error) {
        console.error("Failed to check notification permission state:", error);
      }
    };

    syncNotificationState();

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        syncNotificationState();
      }
    });

    return () => {
      isMounted = false;
      appStateSubscription.remove();
    };
  }, []);

  const handleNotificationToggle = async (nextValue: boolean) => {
    if (isNotificationToggleBusy) {
      return;
    }

    setIsNotificationToggleBusy(true);

    try {
      if (nextValue) {
        const granted = await requestFirebasePermission();

        if (!granted) {
          setNotificationsEnabled(false);
          Alert.alert(
            "Permission required",
            "Enable notifications in system settings to receive background alerts.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  Linking.openSettings().catch(() => {
                    Alert.alert("Unable to open settings", "Please open device settings manually.");
                  });
                },
              },
            ]
          );
          return;
        }

        const token = await getFcmToken();
        if (token) {
          await axiosInstance.post("/users/push-token", { pushToken: token });
        }

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        await updateDigestPreferences({
          timezone,
          dailyDigestEnabled: true,
          digestHourLocal: 19,
        });

        setNotificationsEnabled(true);
        return;
      }

      await updateDigestPreferences({ dailyDigestEnabled: false });
      setNotificationsEnabled(false);

      Alert.alert(
        "Notifications turned off",
        "Daily digest notifications are disabled. To fully block push alerts, disable notifications for Taskora in device settings.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              Linking.openSettings().catch(() => {
                Alert.alert("Unable to open settings", "Please open device settings manually.");
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Failed to update notifications:", error);
      Alert.alert("Update failed", "Could not update notification settings right now.");
      const enabled = await hasNotificationPermission().catch(() => false);
      setNotificationsEnabled(enabled);
    } finally {
      setIsNotificationToggleBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const profileSections = [
    {
      title: "General",
      options: [
        {
          title: "Account Settings",
          icon: "person-outline",
          onPress: () => {
            router.push("/settings/AccountSettings");
          },
        },
        {
          title: "Notifications",
          icon: "notifications-outline",
          rightComponent: (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled={isNotificationToggleBusy}
              trackColor={{ false: "#374151", true: "#8b5cf6" }}
              thumbColor={notificationsEnabled ? "#ffffff" : "#9ca3af"}
            />
          ),
        },
        // {
        //   title: "Appearance",
        //   icon: "moon-outline",
        //   rightComponent: (
        //     <Switch
        //       value={darkModeEnabled}
        //       onValueChange={setDarkModeEnabled}
        //       trackColor={{ false: "#374151", true: "#8b5cf6" }}
        //       thumbColor={darkModeEnabled ? "#ffffff" : "#9ca3af"}
        //     />
        //   ),
        // },
      ],
    },
    {
      title: "Support",
      options: [
        {
          title: "Privacy & Security",
          icon: "shield-checkmark-outline",
          onPress: () => {
            router.push("/settings/PrivacySecurity");
          },
        },
        {
          title: "Help & Support",
          icon: "help-circle-outline",
          onPress: () => {
            router.push("/settings/HelpSupport");
          },
        },
        {
          title: "About",
          icon: "information-circle-outline",
          onPress: () => {
            router.push("/settings/About");
          },
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-900">

      {/* Header */}
      <View className="pt-6 pb-4 px-6 bg-gray-900/50">
        <View className="flex-row items-center justify-center">
          <Text className="text-xl font-bold text-white">Profile</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* User Profile Card */}
        <View className="bg-gray-800/80 rounded-2xl p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
          <View className="items-center mb-4">
            {/* Avatar with gradient and camera overlay */}
            <View className="relative mb-3">
              {resolveFileUrl(user?.profileImage) ? (
                <Image
                  source={{ uri: resolveFileUrl(user?.profileImage) }}
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                <View className="w-20 h-20 bg-gray-800 rounded-full items-center justify-center">
                  <Text className="text-white font-bold text-3xl">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              {/* Camera icon overlay */}
              <TouchableOpacity
                onPress={() => router.push("/settings/EditProfile")}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full items-center justify-center border-2 border-gray-800"
              >
                <Ionicons name="camera" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text className="text-white text-xl font-bold mb-1">
              {user?.name || "User"}
            </Text>
            <Text className="text-gray-400 text-sm">
              {user?.email || "user@example.com"}
            </Text>
          </View>

          {/* Edit Profile Button */}
          <Button
            title="Edit Profile"
            onPress={() => router.push("/settings/EditProfile")}
            variant="secondary"
            icon="create-outline"
          />
        </View>

        {/* Settings Sections - Grouped Cards */}
        {profileSections.map((section, sectionIndex) => (
          <View key={section.title} className="mb-4">
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-1 mb-2">
              {section.title}
            </Text>
            <View className="bg-gray-800/80 rounded-xl border border-gray-700/50 overflow-hidden">
              {section.options.map((option, index) => (
                <TouchableOpacity
                  key={option.title}
                  onPress={option.onPress}
                  className={`flex-row items-center justify-between px-4 py-3.5 ${index < section.options.length - 1
                    ? "border-b border-gray-700/30"
                    : ""
                    }`}
                >
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-gray-700/50 rounded-lg items-center justify-center mr-3">
                      <Ionicons
                        name={option.icon as any}
                        size={18}
                        color="#9CA3AF"
                      />
                    </View>
                    <Text className="text-gray-200 font-medium">
                      {option.title}
                    </Text>
                  </View>
                  {option.rightComponent || (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#6B7280"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Account Actions */}
        <View className="bg-gray-800/80 rounded-xl border border-gray-700/50 mb-6">
          <TouchableOpacity
            onPress={() => setShowLogoutModal(true)}
            className="flex-row items-center justify-between px-4 py-3.5"
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-red-500/10 rounded-lg items-center justify-center mr-3">
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color="#EF4444"
                />
              </View>
              <Text className="text-red-400 font-medium">Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="items-center py-4">
          <Text className="text-gray-500 text-sm">Taskora v1.0.0</Text>
          <Text className="text-gray-600 text-xs mt-1">
            © 2024 Taskora. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <Text className="text-white text-xl font-bold mb-2 text-center">
              Logout
            </Text>
            <Text className="text-gray-300 text-center mb-6">
              Are you sure you want to logout?
            </Text>

            <View className="flex-row gap-3">
              <Button
                title="Cancel"
                onPress={() => setShowLogoutModal(false)}
                variant="secondary"
                className="flex-1"
              />
              <Button
                title="Logout"
                onPress={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
                variant="danger"
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
