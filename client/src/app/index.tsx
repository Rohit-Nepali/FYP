import { Link, useRouter } from "expo-router";
import {
  Button,
  Pressable,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as Progress from "react-native-progress";

export default function Index() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const projects = [
    { name: "Project Phoenix", progress: 0.75, color: "#8b5cf6" },
    { name: "Website Redesign", progress: 0.4, color: "#10b981" },
  ];

  const tasks = [
    {
      title: "Review landing page design mockups",
      status: "Overdue",
      project: "Project Phoenix",
      statusColor: "#ef4444",
    },
    {
      title: "Finalize Q3 marketing report",
      status: "Completed",
      project: "Marketing",
      statusColor: "#10b981",
    },
    {
      title: "Draft proposal for Project Phoenix",
      status: "Due Today",
      project: "Project Phoenix",
      statusColor: "#f59e0b",
    },
  ];

  return (
    <ProtectedRoute>
      <SafeAreaView className="flex-1 bg-gray-900">
        <ScrollView className="flex-1 px-5">
          {/* Greeting */}
          <Text className="text-white text-lg mt-2">
            Hi <Text className="font-bold">Olivia</Text>,
          </Text>
          <Text className="text-white text-2xl font-bold mt-1 mb-6">
            What's on your plate?
          </Text>

          {/* Stats */}
          <View className="flex-row justify-between mb-8">
            <View className="bg-gray-800 rounded-2xl p-4 flex-1 mr-3 items-center">
              <View className="bg-red-500 rounded-full w-10 h-10 items-center justify-center mb-2">
                <Text className="text-white font-bold text-lg">!</Text>
              </View>
              <Text className="text-white font-bold text-3xl">5</Text>
              <Text className="text-gray-400 text-sm">Overdue</Text>
            </View>

            <View className="bg-gray-800 rounded-2xl p-4 flex-1 ml-3 items-center">
              <View className="bg-yellow-500 rounded-full w-10 h-10 items-center justify-center mb-2">
                <MaterialIcons name="emoji-events" size={20} color="white" />
              </View>
              <Text className="text-white font-bold text-3xl">8</Text>
              <Text className="text-gray-400 text-sm">Upcoming</Text>
            </View>
          </View>

          {/* Projects */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-semibold">Projects</Text>
            <Link href="/">
              <Text className="text-purple-400 text-sm">See All</Text>
            </Link>
          </View>

          <View className="mb-6 space-y-4">
            {projects.map((project, index) => (
              <TouchableOpacity
                key={index}
                className="bg-gray-800 rounded-xl p-4"
                // onPress={() => router.push(`/project/${project.name}`)}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View
                      className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: project.color + "33" }}
                    >
                      <MaterialIcons
                        name="folder"
                        size={20}
                        color={project.color}
                      />
                    </View>
                    <Text className="text-white font-medium">
                      {project.name}
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-sm">
                    {Math.round(project.progress * 100)}%
                  </Text>
                </View>
                <Progress.Bar
                  progress={project.progress}
                  width={null}
                  height={8}
                  color={project.color}
                  unfilledColor="#374151"
                  borderWidth={0}
                  borderRadius={8}
                  className="mt-1"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Board */}
          <Text className="text-white text-lg font-semibold mb-4">Board</Text>

          <View className="space-y-3 pb-24">
            {tasks.map((task, index) => (
              <TouchableOpacity
                key={index}
                className="bg-gray-800 rounded-xl p-4 flex-row items-center"
                // onPress={() => router.push(`/task/${index}`)}
              >
                <View className="mr-3">
                  <View
                    className={`w-3 h-3 rounded-full`}
                    style={{ backgroundColor: task.statusColor }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium">{task.title}</Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    {task.status} • {task.project}
                  </Text>
                </View>
                {task.status === "Overdue" && (
                  <Text className="text-red-500 text-xs font-medium">
                    Overdue
                  </Text>
                )}
                {task.status === "Completed" && (
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color="#10b981"
                  />
                )}
                {task.status === "Due Today" && (
                  <Text className="text-amber-500 text-xs font-medium">
                    Due Today
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
