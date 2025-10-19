import { Stack } from "expo-router";
import "../../global.css";
import NativeSafeAreaView from "react-native-safe-area-context/src/specs/NativeSafeAreaView";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen />
    </Stack>
  );
}
