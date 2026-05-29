import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { acceptProjectInvite, declineProjectInvite } from "../../services/projectService";
import { theme } from "../../config/theme";
import { formatInviteTokenError } from "../../utils/errorMessages";

type InviteState = "loading" | "ready" | "processing" | "success" | "error";

export default function InviteTokenScreen() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const inviteToken = useMemo(
    () => (Array.isArray(token) ? token[0] : token),
    [token]
  );

  const router = useRouter();
  const { isAuthenticated, isAuthChecking } = useAuth();
  const [state, setState] = useState<InviteState>("loading");
  const [message, setMessage] = useState("Preparing your invite...");

  useEffect(() => {
    if (isAuthChecking) return;

    if (!inviteToken) {
      setState("error");
      setMessage("Invite token is missing from the link.");
      return;
    }

    if (!isAuthenticated) {
      router.replace({
        pathname: "/login",
        params: { inviteToken },
      });
      return;
    }

    setState("ready");
    setMessage("Choose what you want to do with this invitation.");
  }, [inviteToken, isAuthenticated, isAuthChecking, router]);

  const handleAccept = async () => {
    if (!inviteToken) return;

    setState("processing");
    setMessage("Accepting invitation...");

    try {
      await acceptProjectInvite(inviteToken);
      setState("success");
      setMessage("Invitation accepted. Taking you to your workspace...");
      setTimeout(() => {
        router.replace("/");
      }, 900);
    } catch (error: any) {
      const apiMessage = formatInviteTokenError(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Could not accept this invitation."
      );

      setState("error");
      setMessage(apiMessage.message);
    }
  };

  const handleDecline = async () => {
    if (!inviteToken) return;

    setState("processing");
    setMessage("Declining invitation...");

    try {
      await declineProjectInvite(inviteToken);
      setState("success");
      setMessage("Invitation declined.");
      setTimeout(() => {
        router.replace("/");
      }, 900);
    } catch (error: any) {
      const apiMessage = formatInviteTokenError(
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Could not decline this invitation."
      );

      setState("error");
      setMessage(apiMessage.message);
    }
  };

  return (
    <LinearGradient colors={theme.background.gradient} className="flex-1">
      <View className="flex-1 px-8 items-center justify-center">
        {(state === "loading" || state === "processing") && (
          <ActivityIndicator size="large" color="#60a5fa" />
        )}

        <Text className="text-2xl font-bold text-gray-200 mt-5 mb-2 text-center">
          {state === "success"
            ? "Invite Updated"
            : state === "error"
              ? message.includes("expired")
                ? "Invite Expired"
                : "Invite Issue"
              : state === "ready"
                ? "Project Invitation"
                : "Working on your invite"}
        </Text>

        <Text className="text-base text-gray-400 text-center leading-6">
          {message}
        </Text>

        {state === "ready" && (
          <View className="mt-8 w-full gap-3">
            <TouchableOpacity
              className="rounded-xl bg-emerald-500 py-3"
              onPress={handleAccept}
            >
              <Text className="text-center text-white font-semibold">Accept Invite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-xl bg-rose-500 py-3"
              onPress={handleDecline}
            >
              <Text className="text-center text-white font-semibold">Decline Invite</Text>
            </TouchableOpacity>
          </View>
        )}

        {state === "error" && (
          <View className="mt-8 w-full gap-3">
            <TouchableOpacity
              className="rounded-xl bg-blue-500 py-3"
              onPress={() => router.replace("/login")}
            >
              <Text className="text-center text-white font-semibold">Go to Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-xl bg-white/10 py-3"
              onPress={() => router.replace("/")}
            >
              <Text className="text-center text-gray-200 font-semibold">Go to Home</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}
