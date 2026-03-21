import React, { ReactNode } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CheckboxProps {
  label: ReactNode;
  checked: boolean;
  onToggle: () => void;
  error?: string;
  required?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onToggle,
  error,
  required = false,
}) => {
  return (
    <View className="mb-3">
      <TouchableOpacity
        className="flex-row items-start"
        onPress={onToggle}
        activeOpacity={0.6}
      >
        <View
          className={`w-5 h-5 rounded-md mr-3 mt-0.5 justify-center items-center border-2 transition-all ${
            error && !checked
              ? "border-red-500 bg-red-100/10"
              : checked
              ? "border-blue-500/50 bg-blue-500 "
              : "border-gray-500/50 bg-gray-800"
          }`}
        >
          {checked && <Ionicons name="checkmark" size={14} color="white" />}
        </View>
        <Text className={`flex-1 text-xs leading-4 ${
          checked ? "text-gray-200 font-medium" : "text-gray-400"
        }`}>
          {label}
          {required && <Text className="text-red-500"> *</Text>}
        </Text>
      </TouchableOpacity>
      {error && <Text className="text-red-500 text-xs mt-1 ml-8">{error}</Text>}
    </View>
  );
};
