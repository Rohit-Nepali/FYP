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
    <View className="mb-2">
      <TouchableOpacity
        className="flex-row items-start"
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View
          className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 justify-center items-center ${
            error && !checked ? "border-red-500 bg-red-100" : "border-gray-400"
          } ${checked ? "bg-blue-500 border-blue-500" : ""}`}
        >
          {checked && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
        <Text className="flex-1 text-xs text-gray-500 leading-4">
          {label}
          {required && <Text className="text-red-500"> *</Text>}
        </Text>
      </TouchableOpacity>
      {error && <Text className="text-red-500 text-xs mt-1 ml-8">{error}</Text>}
    </View>
  );
};
