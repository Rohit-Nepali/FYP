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
    <View className="mb-5">
      <View
        className={`flex-row items-center rounded-xl px-4 h-14 border transition-all ${
          error 
            ? "bg-red-500/5 border-red-500/40" 
            : "bg-gray-800/50 border-gray-700/50"
        }`}
      >
        <Ionicons 
          name={icon} 
          size={20} 
          color={error ? "#EF4444" : "#8B5CF6"} 
        />
        <TextInput
          className="flex-1 text-base text-gray-100 ml-3 font-medium"
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
          <TouchableOpacity onPress={onTogglePassword} className="p-2">
            <Ionicons
              name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={error ? "#EF4444" : "#8B5CF6"}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View className="flex-row items-center mt-2 ml-1">
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text className="text-red-400 text-xs ml-1 font-medium">{error}</Text>
        </View>
      )}
    </View>
  );
};
