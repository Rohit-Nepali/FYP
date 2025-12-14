import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { theme } from "../../config/theme";
import ProjectCard from "../../components/UI/ProjectCard";
import { getAllProjects, Project, createProject } from "../../services/projectService";

export default function Projects() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [projectTitle, setProjectTitle] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await getAllProjects();
            setProjects(data || []);
        } catch (err) {
            // swallow for now; consider showing a toast/modal
            console.error("Failed to load projects", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!projectTitle.trim()) {
            Alert.alert("Validation", "Please enter a project title");
            return;
        }

        try {
            setSaving(true);
            await createProject({
                title: projectTitle.trim(),
                description: projectDescription.trim() || undefined,
            });
            Alert.alert("Success", "Project created successfully");
            resetModal();
            loadProjects();
        } catch (err) {
            console.error("Failed to create project", err);
            Alert.alert("Error", err instanceof Error ? err.message : "Failed to create project");
        } finally {
            setSaving(false);
        }
    };

    const resetModal = () => {
        setModalVisible(false);
        setProjectTitle("");
        setProjectDescription("");
    };

    return (
        <ProtectedRoute>
            <SafeAreaView className="flex-1 bg-gray-900">
                <View className="pt-6 pb-4 px-6 bg-gray-900/50">
                    <View className="flex-row items-center justify-between mb-2">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        <Text className="text-xl font-bold text-white">Projects</Text>

                        <View style={{ width: 24 }} />
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#60A5FA" />
                    </View>
                ) : (
                    <ScrollView
                        className="flex-1 px-4 py-4"
                        contentContainerStyle={{ paddingBottom: 80 }}
                    >
                        {projects.length === 0 ? (
                            <View className="flex-1 justify-center items-center py-20">
                                <Ionicons name="folder-open-outline" size={64} color="#6B7280" />
                                <Text className="text-gray-400 text-lg mt-4">No projects</Text>
                                <Text className="text-gray-500 text-sm mt-2">
                                    Create a new project to get started
                                </Text>
                            </View>
                        ) : (
                            <View className="space-y-3">
                                {projects.map((p) => (
                                    <ProjectCard
                                        key={p.id}
                                        id={p.id}
                                        title={p.title}
                                        description={p.description || undefined}
                                        membersCount={p.members ? p.members.length : 0}
                                        // progress={0}
                                        onPress={() => router.push(`/projects/${p.id}`)}
                                    />
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}

                {/* New Project Button - Bottom Right */}
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    className="absolute bottom-28 right-4 bg-blue-700 rounded-full p-4 flex-row items-center px-6 shadow-lg"
                >
                    <Ionicons name="add-outline" size={20} color="#fff" />
                    <Text className="text-white font-semibold ml-2">New Project</Text>
                </TouchableOpacity>

                {/* Create Project Modal */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={resetModal}
                >
                    <View className="flex-1 justify-end bg-black/10 ">
                        <LinearGradient
                            colors={["#1F2937", "#111827"]}
                            className="rounded-t-xl p-6 max-h-[70%]"
                        >
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-2xl font-bold text-white">
                                    New Project
                                </Text>
                                <TouchableOpacity onPress={resetModal}>
                                    <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            <View className="mb-4">
                                <TextInput
                                    className="bg-gray-600 rounded-xl px-4 py-3 text-gray-200 "
                                    placeholder="Enter project title"
                                    placeholderTextColor="#6B7280"
                                    value={projectTitle}
                                    onChangeText={setProjectTitle}
                                    editable={!saving}
                                />
                            </View>

                            <View className="mb-6">
                                <TextInput
                                    className="bg-gray-800 rounded-xl px-4 py-3 text-gray-200 border border-gray-700 min-h-[100px]"
                                    placeholder="Enter project description (optional)"
                                    placeholderTextColor="#6B7280"
                                    value={projectDescription}
                                    onChangeText={setProjectDescription}
                                    multiline
                                    textAlignVertical="top"
                                    editable={!saving}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleCreateProject}
                                className="bg-blue-600 rounded-xl py-4 items-center mb-4"
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">
                                        Create Project
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={resetModal}
                                className="bg-gray-700 rounded-xl py-4 items-center"
                                disabled={saving}
                            >
                                <Text className="text-gray-200 font-semibold text-lg">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </Modal>
            </SafeAreaView>
        </ProtectedRoute>
    );
}