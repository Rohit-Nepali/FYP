import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Task, getAllTasks, createTask } from "../services/taskService";
import {
  getAllProjects,
  Project,
  createProject,
} from "../services/projectService";
import { Button } from "@/src/components/UI/Buttons";
import TaskModal from "@/src/components/UI/modals/TaskModal";
import { getAllStatuses, Status } from "@/src/services/statusService";
import { getAllPriorities, Priority } from "@/src/services/priorityService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Greeting Helper ───────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getMotivationalMessage(
  taskCount: number,
  completedCount: number
): string {
  if (taskCount === 0) return "Ready to start something new?";
  if (completedCount === taskCount) return "All caught up! Great job! 🎉";
  if (completedCount > taskCount / 2) return "You're making great progress!";
  return "Let's get things done!";
}

// ─── Stat Card ─────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  onPress,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  color: string;
  onPress?: () => void;
  index: number;
}) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(400)}
      className="flex-1"
    >
      <Container
        onPress={onPress}
        activeOpacity={0.7}
        className="bg-gray-800/70 rounded-2xl border border-gray-700/40 p-4"
      >
        <View
          className="w-9 h-9 rounded-xl items-center justify-center mb-2"
          style={{ backgroundColor: `${color}15` }}
        >
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text className="text-2xl font-bold text-white">{value}</Text>
        <Text className="text-gray-400 text-xs mt-0.5">{label}</Text>
      </Container>
    </Animated.View>
  );
}

// ─── Quick Action Button ───────────────────────────────────────────
function QuickAction({
  icon,
  label,
  color,
  onPress,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 60).duration(350)}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="items-center mr-5"
      >
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center mb-2 border"
          style={{
            backgroundColor: `${color}12`,
            borderColor: `${color}25`,
          }}
        >
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text className="text-gray-300 text-xs font-medium">{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Section Header ────────────────────────────────────────────────
function SectionHeader({
  title,
  count,
  actionLabel,
  onAction,
}: {
  title: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center">
        <Text className="text-white text-lg font-bold">{title}</Text>
        {count !== undefined && (
          <View className="bg-gray-700/60 rounded-full px-2 py-0.5 ml-2">
            <Text className="text-gray-300 text-xs font-semibold">{count}</Text>
          </View>
        )}
      </View>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="flex-row items-center"
          activeOpacity={0.6}
        >
          <Text className="text-blue-400 text-sm font-medium mr-1">
            {actionLabel}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#60A5FA" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Skeleton Cards ────────────────────────────────────────────────
function ProjectSkeleton({ index }: { index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(300)}
      className="bg-gray-800/60 rounded-2xl p-4 mb-3 border border-gray-700/30"
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-gray-700 animate-pulse" />
        <View className="flex-1 ml-3">
          <View className="w-32 h-4 bg-gray-700 rounded-lg animate-pulse" />
          <View className="w-20 h-3 bg-gray-700 rounded-lg animate-pulse mt-2" />
        </View>
      </View>
    </Animated.View>
  );
}

function TaskSkeleton({ index }: { index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(300)}
      className="bg-gray-800/60 rounded-2xl p-4 mb-3 border border-gray-700/30"
    >
      <View className="flex-row items-start">
        <View className="w-6 h-6 rounded-full bg-gray-700 animate-pulse" />
        <View className="flex-1 ml-3">
          <View className="w-40 h-4 bg-gray-700 rounded-lg animate-pulse" />
          <View className="flex-row mt-2 gap-2">
            <View className="w-16 h-5 bg-gray-700 rounded-md animate-pulse" />
            <View className="w-20 h-5 bg-gray-700 rounded-md animate-pulse" />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Project Card ──────────────────────────────────────────────────
function ProjectCard({
  project,
  index,
  onPress,
}: {
  project: Project & { taskCount?: number; memberCount?: number };
  index: number;
  onPress: () => void;
}) {
  const getProjectColor = (title: string) => {
    const colors = [
      "#60A5FA",
      "#34D399",
      "#F472B6",
      "#A78BFA",
      "#FBBF24",
      "#F87171",
    ];
    const idx = title
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[idx % colors.length];
  };

  const color = getProjectColor(project.title);

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="bg-gray-800/70 rounded-2xl p-4 mb-3 border border-gray-700/40"
      >
        <View className="flex-row items-center">
          {/* Icon */}
          <View
            className="w-11 h-11 rounded-xl items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Ionicons name="folder" size={20} color={color} />
          </View>

          {/* Info */}
          <View className="flex-1 ml-3">
            <Text className="text-white font-semibold text-base" numberOfLines={1}>
              {project.title}
            </Text>
            <View className="flex-row items-center mt-1 gap-3">
              {project.taskCount !== undefined && (
                <View className="flex-row items-center">
                  <Ionicons
                    name="checkbox-outline"
                    size={12}
                    color="#6B7280"
                  />
                  <Text className="text-gray-400 text-xs ml-1">
                    {project.taskCount} tasks
                  </Text>
                </View>
              )}
              {project.memberCount !== undefined && (
                <View className="flex-row items-center">
                  <Ionicons name="people-outline" size={12} color="#6B7280" />
                  <Text className="text-gray-400 text-xs ml-1">
                    {project.memberCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#4B5563" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Task Card ─────────────────────────────────────────────────────
function TaskCard({
  task,
  index,
  onPress,
}: {
  task: Task;
  index: number;
  onPress: () => void;
}) {
  const isCompleted = Boolean(task.isCompleted);

  const isOverdue = useMemo(() => {
    if (!task.dueDate || isCompleted) return false;
    return new Date(task.dueDate) < new Date();
  }, [task.dueDate, isCompleted]);

  const isDueToday = useMemo(() => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate).toDateString() === new Date().toDateString();
  }, [task.dueDate]);

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getPriorityStyle = (priority?: string) => {
    const p = priority?.toLowerCase() || "";
    if (p.includes("urgent") || p.includes("critical"))
      return { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/25" };
    if (p.includes("high"))
      return { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/25" };
    if (p.includes("medium"))
      return { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/25" };
    return { bg: "bg-gray-700/40", text: "text-gray-400", border: "border-gray-600/30" };
  };

  const priorityStyle = getPriorityStyle(task.priority?.name);

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).duration(400)}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`rounded-2xl p-4 mb-3 border ${
          isOverdue
            ? "bg-red-500/5 border-red-500/20"
            : "bg-gray-800/70 border-gray-700/40"
        }`}
      >
        <View className="flex-row items-start">
          {/* Checkbox */}
          <View
            className={`w-6 h-6 rounded-full items-center justify-center border-2 ${
              isCompleted
                ? "bg-emerald-500/20 border-emerald-500"
                : "border-gray-500"
            }`}
          >
            {isCompleted && (
              <Ionicons name="checkmark" size={14} color="#34D399" />
            )}
          </View>

          {/* Content */}
          <View className="flex-1 ml-3">
            <Text
              className={`font-semibold text-base ${
                isCompleted ? "text-gray-500 line-through" : "text-white"
              }`}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            {/* Meta row */}
            <View className="flex-row items-center mt-2 flex-wrap gap-2">
              {/* Priority badge */}
              {task.priority?.name && (
                <View
                  className={`px-2 py-0.5 rounded-md border ${priorityStyle.bg} ${priorityStyle.border}`}
                >
                  <Text className={`text-[10px] font-semibold ${priorityStyle.text}`}>
                    {task.priority.name}
                  </Text>
                </View>
              )}

              {/* Due date */}
              {task.dueDate && (
                <View className="flex-row items-center">
                  <Ionicons
                    name={isOverdue ? "warning" : "calendar-outline"}
                    size={12}
                    color={
                      isOverdue
                        ? "#F87171"
                        : isDueToday
                        ? "#FBBF24"
                        : "#6B7280"
                    }
                  />
                  <Text
                    className={`text-xs ml-1 font-medium ${
                      isOverdue
                        ? "text-red-400"
                        : isDueToday
                        ? "text-amber-400"
                        : "text-gray-400"
                    }`}
                  >
                    {formatDueDate(task.dueDate)}
                  </Text>
                </View>
              )}

              {/* Project name */}
              {/* {task.project?.title && (
                <View className="flex-row items-center">
                  <Ionicons name="folder-outline" size={12} color="#6B7280" />
                  <Text
                    className="text-gray-400 text-xs ml-1"
                    numberOfLines={1}
                  >
                    {task.project.title}
                  </Text>
                </View>
              )} */}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={16} color="#4B5563" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Empty State ───────────────────────────────────────────────────
function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="py-10 items-center justify-center bg-gray-800/40 rounded-2xl border border-gray-700/30">
      <View className="bg-gray-700/30 rounded-full p-4 mb-3">
        <Ionicons name={icon} size={32} color="#4B5563" />
      </View>
      <Text className="text-gray-300 font-semibold text-base">{title}</Text>
      <Text className="text-gray-500 text-sm mt-1 text-center px-8">
        {subtitle}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="mt-4 bg-blue-500/15 border border-blue-500/30 px-5 py-2.5 rounded-xl flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="add-outline" size={18} color="#60A5FA" />
          <Text className="text-blue-400 font-semibold ml-1.5">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Project creation modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Task creation modal state
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);

  const loadProjects = useCallback(async () => {
    try {
      setProjectError(null);
      setLoadingProjects(true);
      const result = await getAllProjects();
      setProjects(result as Project[]);
    } catch (error) {
      setProjectError(
        error instanceof Error ? error.message : "Failed to load projects"
      );
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setTaskError(null);
      setLoadingTasks(true);
      const result = await getAllTasks({ limit: 5, page: 1 });
      setTasks(result.tasks);
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Failed to load tasks"
      );
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  const loadTaskData = useCallback(async () => {
    try {
      const [statusesData, prioritiesData] = await Promise.all([
        getAllStatuses(),
        getAllPriorities(),
      ]);
      setStatuses(statusesData);
      setPriorities(prioritiesData);
    } catch (error) {
      console.error("Failed to load task data:", error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadProjects();
    loadTasks();
    loadTaskData();
  }, [isAuthenticated, loadProjects, loadTasks, loadTaskData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProjects(), loadTasks()]);
    setRefreshing(false);
  }, [loadProjects, loadTasks]);

  const handleCreateProject = async () => {
    if (!projectTitle.trim()) {
      Alert.alert("Error", "Project title is required");
      return;
    }
    try {
      setCreating(true);
      await createProject({
        title: projectTitle.trim(),
        description: projectDescription.trim(),
      });
      setProjectTitle("");
      setProjectDescription("");
      setCreateModalVisible(false);
      await loadProjects();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to create project"
      );
    } finally {
      setCreating(false);
    }
  };

  // Stats calculations
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.isCompleted).length;
    const overdue = tasks.filter(
      (t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;
    return { total, completed, overdue, projects: projects.length };
  }, [tasks, projects]);

  const firstName = user?.name?.split(" ")[0] || "there";
  const greeting = getGreeting();
  const motivationalMessage = getMotivationalMessage(stats.total, stats.completed);

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#60A5FA"]}
            tintColor="#60A5FA"
          />
        }
      >
        {/* ─── Header ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.duration(400)} className="px-5 pt-4 pb-6">
          {/* Top row */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-gray-400 text-sm">{greeting},</Text>
              <Text className="text-white text-2xl font-bold mt-0.5">
                {firstName}! 👋
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="bg-gray-800/60 rounded-full p-2 border border-gray-700/40"
            >
              <Ionicons name="person-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Motivational message */}
          <View className="bg-gray-800/50 rounded-2xl px-4 py-3 border border-gray-700/30">
            <Text className="text-gray-300 text-sm">{motivationalMessage}</Text>
          </View>
        </Animated.View>

        {/* ─── Stats Cards ───────────────────────────────────────── */}
        <View className="px-5 mb-6">
          <View className="flex-row gap-3">
            <StatCard
              icon="checkbox-outline"
              label="Total Tasks"
              value={stats.total}
              color="#60A5FA"
              index={0}
              onPress={() => router.push("/tasks")}
            />
            <StatCard
              icon="checkmark-circle-outline"
              label="Completed"
              value={stats.completed}
              color="#34D399"
              index={1}
            />
            <StatCard
              icon="warning-outline"
              label="Overdue"
              value={stats.overdue}
              color="#F87171"
              index={2}
            />
          </View>
        </View>

        {/* ─── Quick Actions ─────────────────────────────────────── */}
        <View className="px-5 mb-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Quick Actions
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <QuickAction
              icon="add-circle-outline"
              label="New Task"
              color="#60A5FA"
              onPress={() => {
                setSelectedProjectId("");
                setTaskModalVisible(true);
              }}
              index={0}
            />
            <QuickAction
              icon="folder-outline"
              label="New Project"
              color="#A78BFA"
              onPress={() => setCreateModalVisible(true)}
              index={1}
            />
            <QuickAction
              icon="list-outline"
              label="All Tasks"
              color="#34D399"
              onPress={() => router.push("/tasks")}
              index={2}
            />
            <QuickAction
              icon="grid-outline"
              label="Projects"
              color="#F472B6"
              onPress={() => router.push("/projects/page")}
              index={3}
            />
          </ScrollView>
        </View>

        {/* ─── Projects Section ──────────────────────────────────── */}
        <View className="px-5 mb-6">
          <SectionHeader
            title="Projects"
            count={projects.length}
            actionLabel={projects.length > 2 ? "See All" : undefined}
            onAction={() => router.push("/projects/page")}
          />

          {loadingProjects ? (
            <View>
              {[0, 1].map((i) => (
                <ProjectSkeleton key={i} index={i} />
              ))}
            </View>
          ) : projectError ? (
            <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="cloud-offline-outline" size={18} color="#F87171" />
                <Text className="text-red-300 font-semibold ml-2">
                  Unable to load projects
                </Text>
              </View>
              <Text className="text-gray-400 text-sm mb-3">{projectError}</Text>
              <TouchableOpacity
                onPress={loadProjects}
                className="bg-red-500/15 border border-red-500/30 px-4 py-2 rounded-xl self-start"
              >
                <Text className="text-red-400 font-medium text-sm">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : projects.length === 0 ? (
            <EmptyState
              icon="folder-open-outline"
              title="No projects yet"
              subtitle="Create your first project to organize your tasks."
              actionLabel="Create Project"
              onAction={() => setCreateModalVisible(true)}
            />
          ) : (
            <View>
              {projects.slice(0, 3).map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onPress={() => router.push(`/projects/${project.id}`)}
                />
              ))}

              <Animated.View
                entering={FadeInDown.delay(320).duration(350)}
                className="mt-2 gap-2"
              >
                <TouchableOpacity
                  onPress={() => setCreateModalVisible(true)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-center py-3.5 rounded-2xl bg-blue-600/90"
                >
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">
                    Create New Project
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/projects/page")}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-center py-3 rounded-2xl bg-gray-800/70 border border-gray-700/40"
                >
                  <Text className="text-gray-300 font-medium">
                    View All Projects
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#9CA3AF"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </View>

        {/* ─── Tasks Section ─────────────────────────────────────── */}
        <View className="px-5">
          <SectionHeader
            title="Recent Tasks"
            count={tasks.length}
            actionLabel={tasks.length > 0 ? "See All" : undefined}
            onAction={() => router.push("/tasks")}
          />

          {loadingTasks ? (
            <View>
              {[0, 1, 2].map((i) => (
                <TaskSkeleton key={i} index={i} />
              ))}
            </View>
          ) : taskError ? (
            <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="cloud-offline-outline" size={18} color="#F87171" />
                <Text className="text-red-300 font-semibold ml-2">
                  Unable to load tasks
                </Text>
              </View>
              <Text className="text-gray-400 text-sm mb-3">{taskError}</Text>
              <TouchableOpacity
                onPress={loadTasks}
                className="bg-red-500/15 border border-red-500/30 px-4 py-2 rounded-xl self-start"
              >
                <Text className="text-red-400 font-medium text-sm">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title="You're all caught up!"
              subtitle="Create a new task to get started."
              actionLabel="Create Task"
              onAction={() => {
                setSelectedProjectId("");
                setTaskModalVisible(true);
              }}
            />
          ) : (
            <View>
              {tasks.slice(0, 5).map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onPress={() => router.push(`/tasks/${task.id}`)}
                />
              ))}

              {/* Action buttons */}
              <Animated.View
                entering={FadeInDown.delay(400).duration(350)}
                className="mt-2 gap-2"
              >
                <TouchableOpacity
                  onPress={() => {
                    setSelectedProjectId("");
                    setTaskModalVisible(true);
                  }}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-center py-3.5 rounded-2xl bg-blue-600/90"
                >
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">
                    Create New Task
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/tasks")}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-center py-3 rounded-2xl bg-gray-800/70 border border-gray-700/40"
                >
                  <Text className="text-gray-300 font-medium">
                    View All Tasks
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#9CA3AF"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ─── Project Creation Modal ──────────────────────────────── */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <Animated.View entering={FadeInUp.duration(300)}>
            <View className="bg-gray-900 rounded-t-3xl border-t border-gray-700/50">
              {/* Drag handle */}
              <View className="w-10 h-1 bg-gray-600 rounded-full self-center mt-3 mb-2" />

              <View className="px-6 pt-2 pb-8">
                <Text className="text-white text-xl font-bold mb-1">
                  Create New Project
                </Text>
                <Text className="text-gray-400 text-sm mb-6">
                  Organize your tasks into a new project.
                </Text>

                <Text className="text-gray-300 text-sm font-medium mb-2">
                  Project Title <Text className="text-red-400">*</Text>
                </Text>
                <TextInput
                  value={projectTitle}
                  onChangeText={setProjectTitle}
                  placeholder="Enter project title"
                  placeholderTextColor="#4B5563"
                  className="bg-gray-800 text-white rounded-xl px-4 py-3.5 mb-4 border border-gray-700/50"
                />

                <Text className="text-gray-300 text-sm font-medium mb-2">
                  Description{" "}
                  <Text className="text-gray-500 font-normal">(Optional)</Text>
                </Text>
                <TextInput
                  value={projectDescription}
                  onChangeText={setProjectDescription}
                  placeholder="Add a brief description"
                  placeholderTextColor="#4B5563"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-gray-800 text-white rounded-xl px-4 py-3.5 mb-6 border border-gray-700/50 min-h-[80px]"
                />

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setCreateModalVisible(false)}
                    className="flex-1 py-3.5 rounded-xl bg-gray-800 border border-gray-700/50 items-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-gray-300 font-semibold">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCreateProject}
                    disabled={creating || !projectTitle.trim()}
                    className={`flex-1 py-3.5 rounded-xl items-center flex-row justify-center ${
                      creating || !projectTitle.trim()
                        ? "bg-blue-600/50"
                        : "bg-blue-600"
                    }`}
                    activeOpacity={0.7}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="add-outline" size={18} color="#fff" />
                        <Text className="text-white font-semibold ml-1">
                          Create
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ─── Task Creation Modal ─────────────────────────────────── */}
      <TaskModal
        visible={taskModalVisible}
        onClose={() => {
          setTaskModalVisible(false);
          setSelectedProjectId("");
        }}
        onSave={async (payload) => {
          const taskData = {
            ...payload,
            ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
          };
          const task = await createTask(taskData);
          await loadTasks();
          return task;
        }}
        statuses={statuses}
        setStatuses={setStatuses}
        priorities={priorities}
        setPriorities={setPriorities}
        projectId={selectedProjectId}
      />
    </SafeAreaView>
  );
}