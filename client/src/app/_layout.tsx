import { Stack } from "expo-router";
import "../../global.css";

export default function RootLayout() {
  return (
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
        name="first"
        options={{
          title: "First Page",
        }}
      />
      <Stack.Screen
        name="second"
        options={{
          title: "Second Page",
        }}
      />
      <Stack.Screen
        name="third"
        options={{
          title: "Third Page",
        }}
      />
      <Stack.Screen
        name="(someone)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
