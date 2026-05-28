import React, { useEffect } from "react";
import {
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../config/theme";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  position?: "top" | "bottom";
  onDismiss: () => void;
}

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case "success":
      return {
        icon: "checkmark-circle",
        bgColor: "rgba(16, 185, 129, 0.95)", // green-500
        borderColor: "rgba(16, 185, 129, 0.3)",
        textColor: "#FFFFFF",
      };
    case "error":
      return {
        icon: "close-circle",
        bgColor: "rgba(239, 68, 68, 0.95)", // red-500
        borderColor: "rgba(239, 68, 68, 0.3)",
        textColor: "#FFFFFF",
      };
    case "warning":
      return {
        icon: "warning",
        bgColor: "rgba(245, 158, 11, 0.95)", // amber-500
        borderColor: "rgba(245, 158, 11, 0.3)",
        textColor: "#FFFFFF",
      };
    case "info":
    default:
      return {
        icon: "information-circle",
        bgColor: "rgba(59, 130, 246, 0.95)", // blue-500
        borderColor: "rgba(59, 130, 246, 0.3)",
        textColor: "#FFFFFF",
      };
  }
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = "info",
  duration = 2500,
  position = "bottom",
  onDismiss,
}) => {
  const { top, bottom } = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const config = getToastConfig(type);

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss();
      });
    }
  }, [visible, duration, slideAnim, onDismiss]);

  if (!visible) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: position === "top" ? [-200, 0] : [200, 0],
  });

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        position: "absolute",
        top: position === "top" ? top + 16 : undefined,
        bottom: position === "bottom" ? bottom + 16 : undefined,
        left: 16,
        right: 16,
        zIndex: 999,
      }}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={onDismiss}
        activeOpacity={0.9}
        style={{
          backgroundColor: config.bgColor,
          borderWidth: 1,
          borderColor: config.borderColor,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons
          name={config.icon as any}
          size={20}
          color={config.textColor}
        />
        <Text
          style={{
            flex: 1,
            color: config.textColor,
            fontSize: 14,
            fontWeight: "500",
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Toast;
