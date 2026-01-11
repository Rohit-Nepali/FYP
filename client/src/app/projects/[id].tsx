import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getProjectById, Project } from "../../services/projectService";
import ProjectTasksList from "../../components/ProjectTasksList";
import AddMembersModal from "../../components/UI/AddMembersModal";
import InviteMemberModal from "../../components/UI/InviteMemberModal";

interface ProjectData extends Project {
  tasks?: any[];
}

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks'>('tasks');
  const [addMembersModalVisible, setAddMembersModalVisible] = useState(false);
  const [inviteEmailModalVisible, setInviteEmailModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

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

  const members = project.members || [];
  const previewMembers = members.slice(0, 3);
  const extraCount = memberCount - previewMembers.length;

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  const existingMemberIds = project?.members?.map((m: any) => m.userId || m.id) || [];

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

          {/* Contextual actions */}
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="ellipsis-vertical-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Modal */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View className="absolute top-16 right-6 bg-gray-800 rounded-xl border border-gray-700 p-1 shadow-xl w-56 z-50">
            <TouchableOpacity
              className="flex-row items-center p-3 rounded-lg active:bg-gray-700"
              onPress={() => {
                setMenuVisible(false);
                setAddMembersModalVisible(true);
              }}
            >
              <Ionicons name="person-add-outline" size={20} color="#fff" />
              <Text className="text-white ml-3 font-medium">Add Members</Text>
            </TouchableOpacity>
            
            <View className="h-px bg-gray-700 my-1" />
            
            <TouchableOpacity
              className="flex-row items-center p-3 rounded-lg active:bg-gray-700"
              onPress={() => {
                setMenuVisible(false);
                setInviteEmailModalVisible(true);
              }}
            >
              <Ionicons name="mail-outline" size={20} color="#fff" />
              <Text className="text-white ml-3 font-medium">Invite via Email</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <AddMembersModal
        visible={addMembersModalVisible}
        onClose={() => setAddMembersModalVisible(false)}
        projectId={id as string}
        onSuccess={() => loadProjectDetail(id as string)}
        existingMemberIds={existingMemberIds}
      />

      <InviteMemberModal
        visible={inviteEmailModalVisible}
        onClose={() => setInviteEmailModalVisible(false)}
        projectId={id as string}
        onSuccess={() => loadProjectDetail(id as string)}
      />

      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Project summary */}
        <View className="bg-gray-800 rounded-2xl p-4 border mb-4">
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
        <View className="flex-row gap-3 mb-6">
          {/* Members card – now tappable */}
          <TouchableOpacity
            onPress={() => router.push(`/projects/${id}/members`)}
            className="flex-1 bg-gray-800 rounded-xl px-3 py-3 border border-gray-700 flex-row items-center justify-between"
            activeOpacity={0.8}
          >
            <View>
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={18} color="#60A5FA" />
                <Text className="text-gray-400 text-xs ml-2">Members</Text>
              </View>
              <Text className="text-white font-semibold text-base mt-1">
                {memberCount} member{memberCount === 1 ? "" : "s"}
              </Text>
            </View>

            {/* Avatar group */}
            <View className="flex-row items-center">
              {previewMembers.map((member: any, index: number) => {
                const name =
                  member.name || member.fullName || member.username || "User";
                const initials = getInitials(name);

                const avatar = member.avatarUrl;

                return (
                  <View
                    key={member.id ?? index}
                    style={{ marginLeft: index === 0 ? 0 : -10 }}
                  >
                    {avatar ? (
                      <Image
                        source={{ uri: avatar }}
                        className="w-8 h-8 rounded-full border-2 border-gray-900"
                      />
                    ) : (
                      <View className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 items-center justify-center">
                        <Text className="text-xs text-white font-semibold">
                          {initials}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {extraCount > 0 && (
                <View
                  className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 items-center justify-center ml-1"
                >
                  <Text className="text-xs text-gray-200 font-semibold">
                    +{extraCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
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
            onPress={() => setActiveTab('tasks')}
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

        {/* Tasks Content - Embedded View */}
        {activeTab === 'tasks' && id && typeof id === 'string' && (
          <ProjectTasksList projectId={id} />
        )}

      </ScrollView>
    </SafeAreaView >
  );
}