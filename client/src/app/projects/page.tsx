import React, { useEffect, useState, useMemo } from "react";
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
import ProjectCard from "../../components/UI/ProjectCard";
import {
  getAllProjects,
  Project,
  createProject,
} from "../../services/projectService";
import BoardColumn from "@/src/components/Boards/BoardColumn";
import BoardProjectCard from "@/src/components/Boards/BoardProjectCard";

// ---------- Types for view/filter/sort ----------

type ViewMode = "list" | "board";

type StatusFilter = "all" | "todo" | "in_progress" | "done";

type SortOption =
  | "title_asc"
  | "title_desc"
  | "members_asc"
  | "members_desc";

export default function Projects() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // New UI state
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("title_asc");
  const [sortModalVisible, setSortModalVisible] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getAllProjects();
      setProjects(data || []);
    } catch (err) {
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
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to create project"
      );
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    setModalVisible(false);
    setProjectTitle("");
    setProjectDescription("");
  };

  // ---------- Derived data: status, filter, sort ----------

  // Make sure we always have a status value; default to "todo"
  const getStatus = (project: Project): "todo" | "in_progress" | "done" => {
    const raw = (project as any).status ?? "todo";
    if (raw === "in_progress" || raw === "done") return raw;
    return "todo";
  };

  // Filter by status
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter === "all") return true;
      return getStatus(p) === statusFilter;
    });
  }, [projects, statusFilter]);

  // Sort helper
  const sortProjects = (items: Project[]) => {
    const copy = [...items];
    copy.sort((a, b) => {
      const membersA = a.members ? a.members.length : 0;
      const membersB = b.members ? b.members.length : 0;

      switch (sortOption) {
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
        case "members_asc":
          return membersA - membersB;
        case "members_desc":
          return membersB - membersA;
        default:
          return 0;
      }
    });
    return copy;
  };

  const visibleProjects = useMemo(
    () => sortProjects(filteredProjects),
    [filteredProjects, sortOption]
  );

  // For board view: group by status after filter + sort
  const todoProjects = useMemo(
    () => visibleProjects.filter((p) => getStatus(p) === "todo"),
    [visibleProjects]
  );
  const inProgressProjects = useMemo(
    () => visibleProjects.filter((p) => getStatus(p) === "in_progress"),
    [visibleProjects]
  );
  const doneProjects = useMemo(
    () => visibleProjects.filter((p) => getStatus(p) === "done"),
    [visibleProjects]
  );

  // ---------- UI ----------

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center py-20">
      <Ionicons name="folder-open-outline" size={64} color="#6B7280" />
      <Text className="text-gray-400 text-lg mt-4">No projects</Text>
      <Text className="text-gray-500 text-sm mt-2 text-center">
        {projects.length === 0
          ? "Create a new project to get started"
          : "No projects match the current filters"}
      </Text>
    </View>
  );

  const renderListView = () => (
    <View className="space-y-3 mt-4">
      {visibleProjects.map((p) => (
        <ProjectCard
          key={p.id}
          id={p.id}
          title={p.title}
          description={p.description || undefined}
          membersCount={p.members ? p.members.length : 0}
          onPress={() => router.push(`/projects/${p.id}`)}
        />
      ))}
    </View>
  );

  const renderBoardView = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 16 }}
      className="mt-4"
    >
      <View className="flex-row">
        <BoardColumn
          title="Todo"
          count={todoProjects.length}
          color="bg-blue-600"
        >
          {todoProjects.map((p) => (
            <BoardProjectCard
              key={p.id}
              title={p.title}
              description={p.description || undefined}
              membersCount={p.members ? p.members.length : 0}
              onPress={() => router.push(`/projects/${p.id}`)}
            />
          ))}
        </BoardColumn>

        <BoardColumn
          title="In Progress"
          count={inProgressProjects.length}
          color="bg-yellow-600"
        >
          {inProgressProjects.map((p) => (
            <BoardProjectCard
              key={p.id}
              title={p.title}
              description={p.description || undefined}
              membersCount={p.members ? p.members.length : 0}
              onPress={() => router.push(`/projects/${p.id}`)}
            />
          ))}
        </BoardColumn>

        <BoardColumn
          title="Done"
          count={doneProjects.length}
          color="bg-green-600"
        >
          {doneProjects.map((p) => (
            <BoardProjectCard
              key={p.id}
              title={p.title}
              description={p.description || undefined}
              membersCount={p.members ? p.members.length : 0}
              onPress={() => router.push(`/projects/${p.id}`)}
            />
          ))}
        </BoardColumn>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Top header */}
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
          {/* View mode toggle + Sort button */}
          <View className="flex-row items-center justify-between mb-2">
            {/* View mode toggle */}
            <View className="flex-row bg-gray-800 rounded-full p-1 mb-2">
              <TouchableOpacity
                onPress={() => setViewMode("list")}
                className={`flex-row items-center px-3 py-1 rounded-full ${viewMode === "list" ? "bg-gray-700" : "bg-transparent"
                  }`}
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={viewMode === "list" ? "#FFFFFF" : "#9CA3AF"}
                />
                <Text
                  className={`ml-1 text-sm font-bold ${viewMode === "list" ? "text-white" : "text-gray-400"
                    }`}
                >
                  List
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode("board")}
                className={`flex-row items-center px-3 py-1 rounded-full ml-1 ${viewMode === "board" ? "bg-gray-700" : "bg-transparent"
                  }`}
              >
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color={viewMode === "board" ? "#FFFFFF" : "#9CA3AF"}
                />
                <Text
                  className={`ml-1 text-l font-medium ${viewMode === "board" ? "text-white" : "text-gray-400"
                    }`}
                >
                  Board
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sort button */}
            <TouchableOpacity
              onPress={() => setSortModalVisible(true)}
              className="flex-row items-center px-3 py-1 rounded-full bg-gray-800"
            >
              <Ionicons
                name="swap-vertical-outline"
                size={16}
                color="#E5E7EB"
              />
              <Text className="ml-1 text-s font-medium text-gray-200">
                Sort
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter chips (status) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-2"
          >
            {[
              { key: "all", label: "All" },
              { key: "todo", label: "Todo" },
              { key: "in_progress", label: "In Progress" },
              { key: "done", label: "Done" },
            ].map((opt) => {
              const active = statusFilter === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setStatusFilter(opt.key as StatusFilter)}
                  className={`px-3 py-1 rounded-full mr-2 border  ${active
                    ? "bg-blue-600 border-blue-400"
                    : "bg-gray-800 border-gray-700"
                    }`}
                >
                  <Text
                    className={`text-sm font-medium ${active ? "text-white" : "text-gray-300"
                      }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Content */}
          {visibleProjects.length === 0
            ? renderEmptyState()
            : viewMode === "list"
              ? renderListView()
              : renderBoardView()}
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

      {/* Sort Options Modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center">
          <View className="bg-gray-900 rounded-2xl w-72 p-4 border border-gray-700">
            <Text className="text-white font-semibold text-lg mb-3">
              Sort by
            </Text>

            {[
              { key: "title_asc", label: "Title A–Z" },
              { key: "title_desc", label: "Title Z–A" },
              { key: "members_desc", label: "Most members" },
              { key: "members_asc", label: "Fewest members" },
            ].map((opt) => {
              const active = sortOption === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => {
                    setSortOption(opt.key as SortOption);
                    setSortModalVisible(false);
                  }}
                  className={`flex-row items-center justify-between px-2 py-2 rounded-lg mb-1 ${active ? "bg-gray-800" : ""
                    }`}
                >
                  <Text
                    className={`text-sm ${active ? "text-white" : "text-gray-200"
                      }`}
                  >
                    {opt.label}
                  </Text>
                  {active && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#60A5FA"
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => setSortModalVisible(false)}
              className="mt-2 items-center"
            >
              <Text className="text-gray-400 text-sm">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Project Modal (unchanged) */}
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
  );
}