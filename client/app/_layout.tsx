import { Stack } from "expo-router";
import "../global.css";
import NativeSafeAreaView from "react-native-safe-area-context/src/specs/NativeSafeAreaView";

export default function RootLayout() {
  return (
    <NativeSafeAreaView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </NativeSafeAreaView>
  );
}
