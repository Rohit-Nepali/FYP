import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { clearBehavioralSignals } from "@/src/services/userService";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Reusable expandable info panel ──────────────────────────────────────────
type InfoPanelProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
};

const InfoPanel = ({ icon, title, children }: InfoPanelProps) => {
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
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-lg bg-gray-700 items-center justify-center mr-3">
            <Ionicons name={icon} size={16} color="#9CA3AF" />
          </View>
          <Text className="text-gray-200 text-sm font-medium">{title}</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#9CA3AF"
        />
      </TouchableOpacity>

      {expanded && (
        <View className="pb-4 pl-11">{children}</View>
      )}
    </View>
  );
};

const InfoText = ({ children }: { children: string }) => (
  <Text className="text-gray-400 text-sm leading-relaxed mb-2">{children}</Text>
);

const BulletPoint = ({ text }: { text: string }) => (
  <View className="flex-row items-start mb-1">
    <Text className="text-gray-500 mr-2 mt-0.5">•</Text>
    <Text className="text-gray-400 text-sm leading-relaxed flex-1">{text}</Text>
  </View>
);

const Badge = ({ label, color }: { label: string; color: string }) => (
  <View
    className="self-start px-2 py-0.5 rounded-full mt-2 mb-1"
    style={{ backgroundColor: color + "22", borderWidth: 1, borderColor: color + "55" }}
  >
    <Text style={{ color, fontSize: 11, fontWeight: "600" }}>{label}</Text>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function PrivacySecurityScreen() {
  const router = useRouter();

  const confirmClearHistory = () => {
    Alert.alert(
      "Clear Activity History",
      "This will delete all your stored behavioural signals. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              const res = await clearBehavioralSignals();
              Alert.alert("Cleared", `Deleted ${res.deletedCount || 0} behavioural signals.`);
            } catch (err) {
              Alert.alert("Error", "Failed to clear behavioural signals. Please try again later.");
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const [isClearing, setIsClearing] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="pt-6 pb-4 px-6 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="pr-4">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Privacy & Security</Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Privacy Controls ── */}
        <View className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-4">
          <Text className="text-gray-100 text-lg font-semibold mb-1">Privacy Controls</Text>
          <Text className="text-gray-500 text-xs mb-4">
            Understand and control how Taskora uses your data.
          </Text>

          {/* Manage Data Sharing */}
          <InfoPanel icon="share-social-outline" title="Manage Data Sharing">
            <InfoText>
              Taskora collects only the data necessary to provide productivity insights. Here is
              what is collected and why:
            </InfoText>
            <BulletPoint text="Task data (titles, due dates, status) — used to calculate risk scores and generate your dashboard." />
            <BulletPoint text="Chatbot reflections — processed by the NLP classifier to identify behavioural patterns such as procrastination or overload." />
            <BulletPoint text="Behavioural signals — stored per user to generate personalised feedback trends over time." />
            <BulletPoint text="Push notification token — used solely to deliver task alerts to your device." />
            <InfoText>
              Taskora does not sell your data to third parties or use it for advertising purposes.
              All data is stored securely and linked only to your account.
            </InfoText>
            <Badge label="No third-party selling" color="#10B981" />
          </InfoPanel>

          {/* Clear Activity History */}
          <View className="border-t border-gray-700">
            <TouchableOpacity
              onPress={confirmClearHistory}
              activeOpacity={0.7}
              className="flex-row justify-between items-center py-4"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-8 h-8 rounded-lg bg-gray-700 items-center justify-center mr-3">
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </View>
                <View>
                  <Text className="text-gray-200 text-sm font-medium">Clear Activity History</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    Deletes behavioural signals
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Security Settings ── */}
        <View className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-4">
          <Text className="text-gray-100 text-lg font-semibold mb-1">Security Settings</Text>
          <Text className="text-gray-500 text-xs mb-4">
            How Taskora protects your account and data.
          </Text>

          {/* Active Sessions */}
          <InfoPanel icon="phone-portrait-outline" title="Active Sessions">
            <InfoText>
              Each time you sign in, Taskora creates a secure session tied to your device. Sessions
              are managed as follows:
            </InfoText>
            <BulletPoint text="Each session is identified by a unique refresh token stored server-side." />
            <BulletPoint text="Sessions include your IP address and device info for security auditing." />
            <BulletPoint text="Tokens expire automatically after a set period of inactivity." />
            <BulletPoint text="Logging out invalidates the session token immediately." />
            <InfoText>
              If you believe your account has been accessed without your permission, sign out from
              all devices by logging out and changing your password immediately.
            </InfoText>
            <Badge label="JWT-based session management" color="#6366F1" />
          </InfoPanel>

          {/* Encryption & Data Safety */}
          <InfoPanel icon="shield-checkmark-outline" title="Encryption & Data Safety">
            <InfoText>
              Taskora applies security best practices across all layers of the application:
            </InfoText>
            <BulletPoint text="Passwords are hashed using bcrypt with a salt factor before storage. Plain-text passwords are never stored." />
            <BulletPoint text="All API communication is encrypted in transit via HTTPS/TLS." />
            <BulletPoint text="Authentication uses short-lived JWT access tokens paired with refresh tokens." />
            <BulletPoint text="Database access is restricted to the backend service only — no direct public exposure." />
            <BulletPoint text="The ML microservice runs as an internal service and is not publicly accessible." />
            <InfoText>
              Taskora does not store payment information. No financial data is collected at any point.
            </InfoText>
            <Badge label="bcrypt · JWT · HTTPS" color="#F59E0B" />
          </InfoPanel>
        </View>

        {/* ── Data Retention Note ── */}
        <View className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <View className="flex-row items-center mb-3">
            <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
            <Text className="text-gray-400 text-sm font-medium ml-2">Data Retention</Text>
          </View>
          <Text className="text-gray-500 text-xs leading-relaxed">
            Your account data is retained for as long as your account is active. If you delete
            your account, all associated data including tasks, projects, behavioural signals, and
            session records will be permanently removed from our systems within 30 days.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}