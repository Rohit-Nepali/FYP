import { Link, useRouter } from "expo-router";
import { Button, Pressable, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();
  return (
    <View className={"flex justify-center items-center"}>
      <Text className={"text-cyan-700"}>Hello World</Text>
      <Link href={"/first"}>Go to First Page</Link>

      <Button
        title={"Go to Second Page"}
        onPress={() => router.push("/second")}
      />

      <Link href={"/third"} push asChild>
        <Pressable>
          <Text>Go to Third Page</Text>
        </Pressable>
      </Link>
    </View>
  );
}
