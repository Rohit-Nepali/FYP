import { Text, View } from "react-native";
import { Tabs } from "expo-router";

export default function Index() {
  return (
    <View className={"flex justify-center items-center"}>
      <Text className={"text-cyan-700"}>Hello Native Wind Assswholes</Text>
      <Tabs>
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="about" options={{ title: "About" }} />
      </Tabs>
    </View>
  );
}
