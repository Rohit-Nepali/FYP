import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ProjectCard from "../../components/UI/ProjectCard";
import { Button } from "@/src/components/UI/Buttons";
import BottomSheet from "@gorhom/bottom-sheet";
import CreateProjectBottomSheet from "../../components/UI/modals/CreateProjectBottomSheet";
import {
  getAllProjects,
  Project,
  ProjectStatus,
  createProject,
  updateProject,
} from "../../services/projectService";
import BoardColumn from "@/src/components/Boards/BoardColumn";
import BoardProjectCard from "@/src/components/Boards/BoardProjectCard";
import { useAuth } from "@/src/contexts/AuthContext";
import useAlert from "@/src/hooks/useAlert";

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
  const { deleted } = useLocalSearchParams<{ deleted?: string | string[] }>();
  const { user } = useAuth();
  const { showSuccess, showError, AlertComponent } = useAlert();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const createProjectSheetRef = useRef<BottomSheet>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // New UI state
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("title_asc");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusTargetProject, setStatusTargetProject] = useState<Project | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const deletedFlag = Array.isArray(deleted) ? deleted[0] : deleted;
    if (deletedFlag === "1") {
      showSuccess("Project deleted successfully.", "Success");
    }
  }, [deleted, showSuccess]);

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

  const closeCreateProjectSheet = useCallback(() => {
    createProjectSheetRef.current?.close();
  }, []);

  const resetCreateProjectForm = useCallback(() => {
    setProjectTitle("");
    setProjectDescription("");
    closeCreateProjectSheet();
  }, [closeCreateProjectSheet]);

  const handleCreateProject = async () => {
    if (!projectTitle.trim()) {
      showError("Please enter a project title", "Validation Error");
      return;
    }

    try {
      setSaving(true);
      await createProject({
        title: projectTitle.trim(),
        description: projectDescription.trim() || undefined,
      });
      resetCreateProjectForm();
      await loadProjects();
      showSuccess("Project created successfully.", "Success");
    } catch (err) {
      console.error("Failed to create project", err);
      showError(
        err instanceof Error ? err.message : "Failed to create project",
        "Project Creation Failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const insets = useSafeAreaInsets();

  // ---------- Derived data: status, filter, sort ----------

  // Make sure we always have a status value; default to "todo"
  const getStatus = (project: Project): "todo" | "in_progress" | "done" => {
    const raw = project.status ?? "todo";
    if (raw === "in_progress" || raw === "done") return raw;
    return "todo";
  };

  const getStatusMeta = (status: ProjectStatus) => {
    switch (status) {
      case "in_progress":
        return {
          label: "In Progress",
          tint: "#60A5FA",
          border: "#2563EB40",
          background: "rgba(37, 99, 235, 0.14)",
        };
      case "done":
        return {
          label: "Done",
          tint: "#34D399",
          border: "#10B98140",
          background: "rgba(16, 185, 129, 0.14)",
        };
      case "todo":
      default:
        return {
          label: "Todo",
          tint: "#9CA3AF",
          border: "#6B728040",
          background: "rgba(107, 114, 128, 0.14)",
        };
    }
  };

  const statusOptions: Array<{
    value: ProjectStatus;
    label: string;
    description: string;
  }> = [
    {
      value: "todo",
      label: "Todo",
      description: "Move back to the backlog",
    },
    {
      value: "in_progress",
      label: "In Progress",
      description: "Mark as actively being worked on",
    },
    {
      value: "done",
      label: "Done",
      description: "Mark as completed",
    },
  ];

  const openStatusModal = (project: Project) => {
    if (project.ownerId !== user?.id) {
      showError(
        "I can't update the status of this project because it is not mine.",
        "Status Update Unavailable"
      );
      return;
    }

    setStatusTargetProject(project);
    setStatusModalVisible(true);
  };

  const handleProjectStatusUpdate = async (nextStatus: ProjectStatus) => {
    if (!statusTargetProject || statusSaving) return;

    if (statusTargetProject.status === nextStatus) {
      setStatusModalVisible(false);
      setStatusTargetProject(null);
      return;
    }

    try {
      setStatusSaving(true);
      const updatedProject = await updateProject(statusTargetProject.id, {
        status: nextStatus,
      });

      setProjects((prev) =>
        prev.map((project) =>
          project.id === updatedProject.id
            ? { ...project, status: updatedProject.status }
            : project,
        ),
      );

      setStatusModalVisible(false);
      setStatusTargetProject(null);
      showSuccess(`Project moved to ${getStatusMeta(nextStatus).label}.`, "Project Updated");
    } catch (err) {
      console.error("Failed to update project status", err);
      showError(
        err instanceof Error ? err.message : "Failed to update project status",
        "Project Update Failed",
      );
    } finally {
      setStatusSaving(false);
    }
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
          status={getStatus(p)}
          canUpdateStatus={p.ownerId === user?.id}
          onPress={() => router.push(`/projects/${p.id}`)}
          onStatusPress={() => openStatusModal(p)}
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
              status={getStatus(p)}
              canUpdateStatus={p.ownerId === user?.id}
              onPress={() => router.push(`/projects/${p.id}`)}
              onStatusPress={() => openStatusModal(p)}
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
              status={getStatus(p)}
              canUpdateStatus={p.ownerId === user?.id}
              onPress={() => router.push(`/projects/${p.id}`)}
              onStatusPress={() => openStatusModal(p)}
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
              status={getStatus(p)}
              canUpdateStatus={p.ownerId === user?.id}
              onPress={() => router.push(`/projects/${p.id}`)}
              onStatusPress={() => openStatusModal(p)}
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
      {/* Floating Action Button - Bottom Right */}
      <TouchableOpacity
        onPress={() => createProjectSheetRef.current?.expand()}
        className="absolute right-5 flex-row items-center bg-blue-600 rounded-full px-4 py-3.5 shadow-lg"
        style={{
          bottom: Platform.OS === "ios" ? Math.max(insets.bottom + 16, 24) : 24,
          shadowColor: "#2563EB",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text className="text-white font-semibold text-sm ml-1.5 pr-1">
          New Project
        </Text>
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

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!statusSaving) {
            setStatusModalVisible(false);
            setStatusTargetProject(null);
          }
        }}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-5">
          <View className="w-full max-w-[420px] rounded-2xl border border-gray-700 bg-gray-900 p-5">
            <Text className="text-white text-lg font-bold">
              Update Project Status
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              {statusTargetProject?.title}
            </Text>

            <View className="mt-4 gap-3">
              {statusOptions.map((option) => {
                const active =
                  !!statusTargetProject &&
                  getStatus(statusTargetProject) === option.value;
                const meta = getStatusMeta(option.value);

                return (
                  <TouchableOpacity
                    key={option.value}
                    disabled={statusSaving || active}
                    onPress={() => handleProjectStatusUpdate(option.value)}
                    className={`rounded-xl border px-4 py-3 ${active ? "bg-gray-800 border-gray-600" : "bg-gray-800/70 border-gray-700"}`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-white font-semibold">
                          {option.label}
                        </Text>
                        <Text className="text-gray-400 text-xs mt-0.5">
                          {option.description}
                        </Text>
                      </View>
                      <View
                        className="rounded-full border px-2.5 py-1"
                        style={{
                          backgroundColor: meta.background,
                          borderColor: meta.border,
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: meta.tint }}
                        >
                          {active ? "Current" : "Move"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title={statusSaving ? "Updating..." : "Close"}
              onPress={() => {
                if (!statusSaving) {
                  setStatusModalVisible(false);
                  setStatusTargetProject(null);
                }
              }}
              variant="secondary"
              className="w-full mt-4"
              disabled={statusSaving}
            />
          </View>
        </View>
      </Modal>

      {AlertComponent}

      {/* Project Creation Bottom Sheet */}
      <CreateProjectBottomSheet
        sheetRef={createProjectSheetRef}
        projectTitle={projectTitle}
        projectDescription={projectDescription}
        creating={saving}
        onChangeProjectTitle={setProjectTitle}
        onChangeProjectDescription={setProjectDescription}
        onCreateProject={handleCreateProject}
        onClose={resetCreateProjectForm}
      />
    </SafeAreaView>
  );
}