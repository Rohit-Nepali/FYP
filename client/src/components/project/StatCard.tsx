import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export function StatCard({
    icon,
    label,
    value,
    color,
    onPress,
    suffix,
    index,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: number | string;
    color: string;
    onPress?: () => void;
    suffix?: string;
    index: number;
  }) {
    const Container = onPress ? TouchableOpacity : View;
  
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 80).duration(400)}
        className="flex-1"
      >
        <Container
          onPress={onPress}
          activeOpacity={0.7}
          className="bg-gray-800/80 rounded-2xl border border-gray-700/50 p-4"
        >
          <View className="flex-row items-center justify-between">
            <View
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <Ionicons name={icon} size={18} color={color} />
            </View>
            {onPress && (
              <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            )}
          </View>
          <Text className="text-2xl font-bold text-white mt-3">
            {value}
            {suffix && (
              <Text className="text-sm font-normal text-gray-400">
                {" "}
                {suffix}
              </Text>
            )}
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5">{label}</Text>
        </Container>
      </Animated.View>
    );
  }