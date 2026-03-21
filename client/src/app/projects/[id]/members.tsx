import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProjectById, removeProjectMember, Project } from "@/src/services/projectService";
import { useAuth } from "@/src/contexts/AuthContext";
import AddMembersModal from "@/src/components/UI/modals/AddMembersModal";

export default function ProjectMembers() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await getProjectById(id as string);
      setProject(data);
    } catch (err) {
      Alert.alert("Error", "Failed to load project members");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${memberName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setRemovingId(memberId);
              const updatedProject = await removeProjectMember(id as string, memberId);
              setProject(updatedProject);
              Alert.alert("Success", "Member removed");
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Failed to remove member");
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: any }) => {
    // Structure depends on backend response
    // Assuming item is ProjectMember which has user: { id, name, email, profileImage }
    // Or based on getProjectById include: members: { include: { user: ... } }
    // So item.user is the user object, item.role is role
    // item.userId is the user id
    const memberUser = item.user || item; 
    const isOwner = project?.ownerId === memberUser.id;
    const isCurrentUser = user?.id === memberUser.id;
    const canRemove = project?.ownerId === user?.id && !isOwner;

    return (
      <View className="flex-row items-center justify-between p-4 bg-gray-800 rounded-xl mb-3 border border-gray-700">
        <View className="flex-row items-center flex-1">
          {memberUser.profileImage || memberUser.avatarUrl ? (
            <Image
              source={{ uri: memberUser.profileImage || memberUser.avatarUrl }}
              className="w-10 h-10 rounded-full bg-gray-700"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center border border-gray-600">
              <Text className="text-white font-semibold">
                {memberUser.name?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
          
          <View className="ml-3 flex-1">
            <Text className="text-white font-medium text-base">
              {memberUser.name} {isCurrentUser && "(You)"}
            </Text>
            <Text className="text-gray-400 text-xs">{memberUser.email}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {isOwner && (
            <View className="bg-blue-900/40 px-2 py-1 rounded-md border border-blue-800">
              <Text className="text-blue-400 text-xs font-semibold">Owner</Text>
            </View>
          )}
          {!isOwner && item.role === 'admin' && (
             <View className="bg-purple-900/40 px-2 py-1 rounded-md border border-purple-800">
             <Text className="text-purple-400 text-xs font-semibold">Admin</Text>
           </View>
          )}

          {canRemove && (
            <TouchableOpacity 
              onPress={() => handleRemoveMember(memberUser.id, memberUser.name)}
              disabled={removingId === memberUser.id}
              className="p-2 bg-red-900/20 rounded-lg ml-2"
            >
              {removingId === memberUser.id ? (
                 <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                 <Ionicons name="trash-outline" size={18} color="#EF4444" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#60A5FA" />
      </SafeAreaView>
    );
  }

  const existingMemberIds = project?.members?.map((m: any) => m.userId || m.id) || [];

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Project Members</Text>
        </View>
        
        {project?.ownerId === user?.id && (
           <TouchableOpacity onPress={() => setAddModalVisible(true)}>
             <Ionicons name="person-add" size={24} color="#60A5FA" />
           </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={project?.members || []}
        keyExtractor={(item) => item.id || item.userId} // Ensure unique key
        renderItem={renderMember}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center mt-10">No members found</Text>
        }
      />

      <AddMembersModal 
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        projectId={id as string}
        onSuccess={() => loadProject()}
        existingMemberIds={existingMemberIds}
        projectOwnerId={project?.ownerId}
      />
    </SafeAreaView>
  );
}
