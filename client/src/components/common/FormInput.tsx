import React from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FormInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
  icon: keyof typeof Ionicons.glyphMap;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
}

export const FormInput: React.FC<FormInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
  icon,
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
}) => {
  return (
    <View className="mb-4">
      <View
        className={`flex-row items-center bg-gray-800 rounded-xl px-4 h-14 border ${
          error ? "border-red-500" : "border-gray-700"
        }`}
      >
        <Ionicons name={icon} size={20} color={error ? "#EF4444" : "#9CA3AF"} />
        <TextInput
          className="flex-1 text-base text-gray-200 ml-3"
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {showPasswordToggle && onTogglePassword && (
          <TouchableOpacity onPress={onTogglePassword} className="p-1">
            <Ionicons
              name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={error ? "#EF4444" : "#9CA3AF"}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text className="text-red-400 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
};
