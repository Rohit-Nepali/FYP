import React, { useState } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { inviteProjectMember } from "@/src/services/projectService";

interface Props {
    visible: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess?: () => void;
}

export default function InviteMemberModal({
    visible,
    onClose,
    projectId,
    onSuccess,
}: Props) {
    const [email, setEmail] = useState("");
    const [inviting, setInviting] = useState(false);

    const handleInvite = async () => {
        if (!email.trim()) {
            Alert.alert("Validation Error", "Please enter an email address.");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert("Validation Error", "Please enter a valid email address.");
            return;
        }

        try {
            setInviting(true);
            await inviteProjectMember(projectId, email, "member");
            Alert.alert(
                "Success",
                "Invitation sent successfully! If the user exists, they've been added. Otherwise, an invite email has been sent."
            );
            setEmail("");
            onSuccess?.();
            onClose();
        } catch (error) {
            Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Failed to send invitation"
            );
        } finally {
            setInviting(false);
        }
    };

    const handleClose = () => {
        setEmail("");
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View className="flex-1 justify-center items-center bg-black/60 px-4">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="w-full max-w-sm"
                >
                    <LinearGradient
                        colors={["#1F2937", "#111827"]}
                        className="rounded-2xl p-6 border border-gray-700 w-full overflow-hidden"
                    >
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-white">
                                Invite Member
                            </Text>
                            <TouchableOpacity onPress={handleClose}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Description */}
                        <Text className="text-gray-400 text-sm mb-4">
                            Send an invitation to join this project via email. If they're already a user, they'll be added directly.
                        </Text>

                        {/* Email Input */}
                        <View className="mb-4">
                            <Text className="text-gray-400 text-xs mb-2 ml-1">
                                Email Address
                            </Text>
                            <View className="flex-row items-center bg-gray-800 rounded-xl border border-gray-700 px-3">
                                <Ionicons
                                    name="mail-outline"
                                    size={18}
                                    color="#6B7280"
                                    style={{ marginRight: 6 }}
                                />
                                <TextInput
                                    className="flex-1 text-white py-3"
                                    placeholder="user@example.com"
                                    placeholderTextColor="#6B7280"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>



                        {/* Action Buttons */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={handleClose}
                                className="flex-1 py-3 px-4 rounded-xl bg-gray-700"
                                disabled={inviting}
                            >
                                <Text className="text-white font-semibold text-center">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleInvite}
                                disabled={inviting || !email.trim()}
                                className={`flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center ${inviting || !email.trim() ? "bg-gray-700" : "bg-blue-600"
                                    }`}
                            >
                                {inviting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="send-outline"
                                            size={16}
                                            color="#fff"
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text className="text-white font-semibold">
                                            Send Invite
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
