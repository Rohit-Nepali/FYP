import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getProjectById, Project } from "../../services/projectService";

interface ProjectDetail extends Project {
  tasks?: any[];
}

export default function ProjectDashboard() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks'>('dashboard');

  useEffect(() => {
    if (id && typeof id === "string") {
      loadProjectDetail(id);
    }
  }, [id]);

  const loadProjectDetail = async (projectId: string) => {
    try {
      setLoading(true);
      const data = await getProjectById(projectId);
      setProject(data);
    } catch (err) {
      console.error("Failed to load project", err);
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to load project"
      );
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#60A5FA" />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-white text-lg mt-4">Project not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-blue-600 rounded-lg px-6 py-3"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const taskCount = project.tasks?.length || 0;
  const memberCount = project.members?.length || 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="pt-6 pb-4 px-6 bg-gray-900/50 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text
            className="text-lg font-semibold text-white flex-1 ml-4"
            numberOfLines={1}
          >
            {project.title || "Project"}
          </Text>

          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Project summary */}
        <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mr-3">
              <Ionicons name="folder-outline" size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text
                className="text-white font-semibold text-lg"
                numberOfLines={1}
              >
                {project.title}
              </Text>
              {project.description ? (
                <Text
                  className="text-gray-400 text-xs mt-1"
                  numberOfLines={2}
                >
                  {project.description}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="flex-row items-center mt-3">
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#9CA3AF"
            />
            <Text className="text-gray-400 text-xs ml-2">
              Created {formatDate(project.createdAt)}
            </Text>
          </View>
        </View>

        {/* Compact stats */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-gray-800 rounded-xl px-3 py-3 border border-gray-700 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name="people-outline"
                size={18}
                color="#60A5FA"
              />
              <Text className="text-gray-400 text-xs ml-2">Members</Text>
            </View>
            <Text className="text-white font-semibold text-lg">
              {memberCount}
            </Text>
          </View>

          <View className="flex-1 bg-gray-800 rounded-xl px-3 py-3 border border-gray-700 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name="checkmark-done-outline"
                size={18}
                color="#10B981"
              />
              <Text className="text-gray-400 text-xs ml-2">Tasks</Text>
            </View>
            <Text className="text-white font-semibold text-lg">
              {taskCount}
            </Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View className="flex-row bg-gray-800 rounded-xl p-1 mb-6">
          <TouchableOpacity
            onPress={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 px-4 rounded-lg ${activeTab === 'dashboard' ? 'bg-gray-700' : ''}`}
          >
            <Text className={`text-center font-medium ${activeTab === 'dashboard' ? 'text-white' : 'text-gray-400'}`}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/projects/${id}/tasks`)}
            className={`flex-1 py-2 px-4 rounded-lg ${activeTab === 'tasks' ? 'bg-gray-700' : ''}`}
          >
            <Text className={`text-center font-medium ${activeTab === 'tasks' ? 'text-white' : 'text-gray-400'}`}>
              Tasks ({taskCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <View className="space-y-4">
            {/* Quick Actions */}
            <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <Text className="text-white font-semibold text-base mb-3">
                Quick Actions
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => router.push(`/projects/${id}/tasks`)}
                  className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
                >
                  <Ionicons name="add-outline" size={20} color="#fff" />
                  <Text className="text-white font-medium text-sm mt-1">
                    Add Task
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-gray-700 rounded-xl py-3 items-center">
                  <Ionicons name="people-outline" size={20} color="#fff" />
                  <Text className="text-white font-medium text-sm mt-1">
                    Invite
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Activity Placeholder */}
            <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <Text className="text-white font-semibold text-base mb-3">
                Recent Activity
              </Text>
              <View className="items-center py-8">
                <Ionicons name="time-outline" size={40} color="#6B7280" />
                <Text className="text-gray-400 text-sm mt-2">
                  No recent activity
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}