import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/src/components/UI/Buttons";

// Required for LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_ITEMS = [
  {
    question: "How do I create a new task?",
    answer:
      "Open a project, tap the '+' button on the Tasks tab, fill in the title, description, priority, and due date, then tap Create.",
  },
  {
    question: "What is the AI chatbot used for?",
    answer:
      "The chatbot helps you reflect on missed or overdue tasks. It asks why a task was missed and classifies your response into a behavioural pattern (e.g. procrastination, overload) to provide personalised insights.",
  },
  {
    question: "How is task risk calculated?",
    answer:
      "Taskora runs a machine learning model daily that scores each task based on days remaining, recent activity, how frequently you work on it, and your project's historical risk rate. High-risk tasks are flagged in your dashboard.",
  },
  {
    question: "Can I invite others to my project?",
    answer:
      "Yes. Open your project, go to the Members section, and send an invite via email. Invited users can be assigned tasks and will appear in team views.",
  },
  {
    question: "How do I reset my password?",
    answer:
      "On the login screen, tap 'Forgot password', enter your registered email address, and follow the reset link sent to your inbox.",
  },
  {
    question: "Why am I not receiving push notifications?",
    answer:
      "Make sure notifications are enabled for Taskora in your device settings. If you recently signed in on a new device, try signing out and back in to refresh your notification token.",
  },
];

type FAQItemProps = {
  question: string;
  answer: string;
};

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View className="border-b border-gray-700 last:border-b-0">
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        className="flex-row justify-between items-center py-4"
      >
        <Text className="text-gray-200 text-sm font-medium flex-1 pr-3">{question}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#9CA3AF"
        />
      </TouchableOpacity>

      {expanded && (
        <View className="pb-4">
          <Text className="text-gray-400 text-sm leading-relaxed">{answer}</Text>
        </View>
      )}
    </View>
  );
};

export default function HelpSupportScreen() {
  const router = useRouter();

  const openSupportEmail = () => {
    Linking.openURL("mailto:zoruto35@gmail.com").catch(() =>
      Alert.alert("Error", "Unable to open mail client.")
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="pt-6 pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="pr-4">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Help & Support</Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* FAQ Section */}
        <View className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
          <Text className="text-gray-100 text-lg font-semibold mb-1">FAQ</Text>
          <Text className="text-gray-400 text-sm mb-4">
            Frequently asked questions about using Taskora.
          </Text>

          {FAQ_ITEMS.map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </View>

        {/* Contact Section */}
        <View className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <Text className="text-gray-100 text-lg font-semibold mb-3">Contact Us</Text>
          <Text className="text-gray-400 text-sm mb-4">
            Need further help? Reach out to our support team via email.
          </Text>
          <Button
            title="Email Support"
            onPress={openSupportEmail}
            variant="primary"
            icon="mail-outline"
            className="w-full"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}