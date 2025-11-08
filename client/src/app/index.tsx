import { Link, useRouter } from "expo-router";
import { Button, Pressable, Text, View, Alert } from "react-native";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/login");
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  return (
    <ProtectedRoute>
      <View className="flex-1 justify-center items-center p-5 bg-gray-100">
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          Welcome to Productivity App!
        </Text>
        <Text className="text-base text-gray-600 mb-8">
          Hello, {user?.name}!
        </Text>

        <View className="mb-8 items-center">
          <Link
            href={"/first"}
            className="my-2.5 px-2.5 py-2.5 bg-blue-500 rounded-lg"
          >
            <Text className="text-white font-medium">Go to First Page</Text>
          </Link>

          <Button
            title="Go to Second Page"
            onPress={() => router.push("/second")}
          />
        </View>

        <Button title="Logout" onPress={handleLogout} color="#ff4444" />
      </View>
    </ProtectedRoute>
  );
}
