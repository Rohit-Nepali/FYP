import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    Modal,
    Image,
    Animated,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Task, getAllTasks, CreateTaskData } from "@/src/services/taskService";
import { Status, getAllStatuses } from "@/src/services/statusService";
import { Priority, getAllPriorities } from "@/src/services/priorityService";
import TaskModal from "@/src/components/UI/modals/TaskModal";
import { Button } from "@/src/components/UI/Buttons";
import CalendarView from "@/src/components/CalendarView";
import { useAuth } from "@/src/contexts/AuthContext";
import { resolveFileUrl } from "@/src/utils/url";

// Types
interface GroupedTasks {
    overdue: Task[];
    recent: Task[];
    tomorrow: Task[];
    upcoming: Task[];
    completed: Task[];
}

interface ActiveFilters {
    statusIds: string[];
    priorityIds: string[];
}

// Helper functions
const isOverdue = (dueDate: string | undefined): boolean => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
};

const isToday = (dueDate: string | undefined): boolean => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
};

const isTomorrow = (dueDate: string | undefined): boolean => {
    if (!dueDate) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === tomorrow.getTime();
};

const isCompleted = (task: Task): boolean => {
    return Boolean(task.isCompleted);
};

const isFuture = (dueDate: string | undefined): boolean => {
    if (!dueDate) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate > tomorrow;
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return "Today";
    if (date.getTime() === tomorrow.getTime()) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
};

const getDaysOverdue = (dueDate: string | undefined): number => {
    if (!dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - taskDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Group configuration
const GROUP_CONFIG = {
    overdue: {
        title: "Overdue",
        icon: "alert-circle" as const,
        color: "#F97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
    },
    recent: {
        title: "Recent",
        icon: "time" as const,
        color: "#F59E0B",
        bgColor: "rgba(245, 158, 11, 0.1)",
    },
    tomorrow: {
        title: "Tomorrow",
        icon: "sunny-outline" as const,
        color: "#3B82F6",
        bgColor: "rgba(59, 130, 246, 0.1)",
    },
    upcoming: {
        title: "Upcoming",
        icon: "calendar-outline" as const,
        color: "#10B981",
        bgColor: "rgba(16, 185, 129, 0.1)",
    },
    completed: {
        title: "Completed",
        icon: "checkmark-done-circle" as const,
        color: "#6B7280",
        bgColor: "rgba(107, 114, 128, 0.1)",
    },
};

// Task Card Component
interface TaskCardProps {
    task: Task;
    onPress: () => void;
    showOverdueDays?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = React.memo(
    ({ task, onPress, showOverdueDays = false }) => {
        const priorityColor =
            task.priority?.color || (task.priority?.name === "High" ? "#F43F5E" : task.priority?.name === "Medium" ? "#F59E0B" : "#10B981");

        return (
            <TouchableOpacity
                onPress={onPress}
                className="bg-gray-800 rounded-xl p-4 mb-2 flex-row items-center "
                // style={{ borderLeftColor: priorityColor }}
                activeOpacity={0.7}
            >
                {/* Main Content */}
                <View className="flex-1 ml-2">
                    {/* Title */}
                    <Text
                        className="text-white font-semibold text-base mb-1"
                        numberOfLines={1}
                    >
                        {task.title}
                    </Text>

                    {/* Meta Row */}
                    <View className="flex-row items-center flex-wrap gap-2">
                        {/* Priority Badge */}
                        {task.priority && (
                            <View
                                className="px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${priorityColor}20` }}
                            >
                                <Text
                                    className="text-xs font-medium"
                                    style={{ color: priorityColor }}
                                >
                                    {task.priority.name}
                                </Text>
                            </View>
                        )}

                        {/* Due Date */}
                        {task.dueDate && (
                            <View className="flex-row items-center">
                                <Ionicons
                                    name="calendar-outline"
                                    size={12}
                                    color={showOverdueDays ? "#F97316" : "#9CA3AF"}
                                />
                                <Text
                                    className={`text-xs ml-1 ${showOverdueDays ? "text-orange-400" : "text-gray-400"
                                        }`}
                                >
                                    {showOverdueDays
                                        ? `${getDaysOverdue(task.dueDate)} days overdue`
                                        : formatDate(task.dueDate)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Assignee Avatar */}
                {task.assignee ? (
                    <View className="ml-2">
                        {task.assignee.profileImage ? (
                            <Image
                                source={{ uri: resolveFileUrl(task.assignee.profileImage) }}
                                className="w-8 h-8 rounded-full"
                            />
                        ) : (
                            <View
                                className="w-8 h-8 rounded-full items-center justify-center"
                                style={{ backgroundColor: `${priorityColor}30` }}
                            >
                                <Text className="text-white text-xs font-semibold">
                                    {task.assignee.name?.charAt(0)?.toUpperCase() || "?"}
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View className="ml-2">
                        <View className="w-8 h-8 rounded-full bg-gray-700 items-center justify-center">
                            <Ionicons name="person-outline" size={14} color="#6B7280" />
                        </View>
                    </View>
                )}

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            </TouchableOpacity>
        );
    }
);

// Task Group Component
interface TaskGroupProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
    tasks: Task[];
    expanded: boolean;
    onToggle: () => void;
    onTaskPress: (task: Task) => void;
    showOverdueDays?: boolean;
    defaultCollapsed?: boolean;
}

const TaskGroup: React.FC<TaskGroupProps> = ({
    title,
    icon,
    color,
    bgColor,
    tasks,
    expanded,
    onToggle,
    onTaskPress,
    showOverdueDays = false,
    defaultCollapsed = false,
}) => {
    const count = tasks.length;

    if (count === 0 && defaultCollapsed) return null;

    return (
        <View className="mb-4">
            {/* Header */}
            <TouchableOpacity
                onPress={onToggle}
                className="flex-row items-center justify-between py-3 px-4 rounded-xl"
                style={{ backgroundColor: bgColor }}
                activeOpacity={0.7}
            >
                <View className="flex-row items-center">
                    <Ionicons name={icon} size={20} color={color} />
                    <Text className="text-white font-semibold text-base ml-2">
                        {title}
                    </Text>
                    {count > 0 && (
                        <View
                            className="ml-2 px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${color}30` }}
                        >
                            <Text className="text-xs font-medium" style={{ color }}>
                                {count}
                            </Text>
                        </View>
                    )}
                </View>
                <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={color}
                />
            </TouchableOpacity>

            {/* Tasks */}
            {expanded && count > 0 && (
                <View className="mt-2 px-1">
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onPress={() => onTaskPress(task)}
                            showOverdueDays={showOverdueDays}
                        />
                    ))}
                </View>
            )}

            {/* Empty State */}
            {expanded && count === 0 && (
                <View className="mt-2 py-6 items-center bg-gray-800/50 rounded-xl">
                    <Ionicons name="checkmark-circle-outline" size={32} color="#6B7280" />
                    <Text className="text-gray-400 text-sm mt-2">No tasks</Text>
                </View>
            )}
        </View>
    );
};

// Filter Modal Component
interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    statuses: Status[];
    priorities: Priority[];
    activeFilters: ActiveFilters;
    onApply: (filters: ActiveFilters) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    statuses,
    priorities,
    activeFilters,
    onApply,
}) => {
    const [localFilters, setLocalFilters] = useState<ActiveFilters>(activeFilters);

    useEffect(() => {
        setLocalFilters(activeFilters);
    }, [activeFilters, visible]);

    const toggleStatus = (statusId: string) => {
        setLocalFilters((prev) => ({
            ...prev,
            statusIds: prev.statusIds.includes(statusId)
                ? prev.statusIds.filter((id) => id !== statusId)
                : [...prev.statusIds, statusId],
        }));
    };

    const togglePriority = (priorityId: string) => {
        setLocalFilters((prev) => ({
            ...prev,
            priorityIds: prev.priorityIds.includes(priorityId)
                ? prev.priorityIds.filter((id) => id !== priorityId)
                : [...prev.priorityIds, priorityId],
        }));
    };

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleClear = () => {
        setLocalFilters({ statusIds: [], priorityIds: [] });
    };

    const hasActiveFilters =
        localFilters.statusIds.length > 0 || localFilters.priorityIds.length > 0;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-gray-900 rounded-t-3xl p-6 max-h-[70%]">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-white text-xl font-bold">Filter Tasks</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Status Filter */}
                        <View className="mb-6">
                            <Text className="text-gray-300 font-semibold mb-3">Status</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {statuses.map((status) => (
                                    <TouchableOpacity
                                        key={status.id}
                                        onPress={() => toggleStatus(status.id)}
                                        className={`px-4 py-2 rounded-lg border ${localFilters.statusIds.includes(status.id)
                                                ? "bg-blue-600 border-blue-400"
                                                : "bg-gray-800 border-gray-700"
                                            }`}
                                    >
                                        <Text
                                            className={`text-sm font-medium ${localFilters.statusIds.includes(status.id)
                                                    ? "text-white"
                                                    : "text-gray-300"
                                                }`}
                                        >
                                            {status.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Priority Filter */}
                        <View className="mb-6">
                            <Text className="text-gray-300 font-semibold mb-3">Priority</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {priorities.map((priority) => (
                                    <TouchableOpacity
                                        key={priority.id}
                                        onPress={() => togglePriority(priority.id)}
                                        className={`px-4 py-2 rounded-lg border ${localFilters.priorityIds.includes(priority.id)
                                                ? "bg-blue-600 border-blue-400"
                                                : "bg-gray-800 border-gray-700"
                                            }`}
                                    >
                                        <Text
                                            className={`text-sm font-medium ${localFilters.priorityIds.includes(priority.id)
                                                    ? "text-white"
                                                    : "text-gray-300"
                                                }`}
                                        >
                                            {priority.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View className="flex-row gap-3 mt-4">
                        {hasActiveFilters && (
                            <Button
                                title="Clear All"
                                onPress={handleClear}
                                variant="secondary"
                                className="flex-1"
                            />
                        )}
                        <Button
                            title={`Apply Filters${localFilters.statusIds.length + localFilters.priorityIds.length > 0
                                ? ` (${localFilters.statusIds.length + localFilters.priorityIds.length})`
                                : ''}`}
                            onPress={handleApply}
                            variant="primary"
                            className="flex-1"
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Main Tasks Page Component
export default function TasksPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    // Data state
    const [tasks, setTasks] = useState<Task[]>([]);
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // UI state
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
        statusIds: [],
        priorityIds: [],
    });
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        overdue: true,
        recent: true,
        tomorrow: true,
        upcoming: true,
        completed: false,
    });

    // Modal state
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [taskModalVisible, setTaskModalVisible] = useState(false);

    // Load data
    const loadTasks = useCallback(async () => {
        try {
            setError(null);
            const result = await getAllTasks({ limit: 100, page: 1 });
            setTasks(result.tasks);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load tasks");
        }
    }, []);

    const loadFilters = useCallback(async () => {
        try {
            const [statusesData, prioritiesData] = await Promise.all([
                getAllStatuses(),
                getAllPriorities(),
            ]);
            setStatuses(statusesData);
            setPriorities(prioritiesData);
        } catch (err) {
            console.error("Failed to load filters:", err);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const init = async () => {
            setLoading(true);
            await Promise.all([loadTasks(), loadFilters()]);
            setLoading(false);
        };
        init();
    }, [isAuthenticated, loadTasks, loadFilters]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadTasks();
        setRefreshing(false);
    }, [loadTasks]);

    // Filter and group tasks
    const groupedTasks = useMemo<GroupedTasks>(() => {
        let filtered = [...tasks];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (task) =>
                    task.title.toLowerCase().includes(query) ||
                    task.description?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (activeFilters.statusIds.length > 0) {
            filtered = filtered.filter((task) =>
                task.statusId ? activeFilters.statusIds.includes(task.statusId) : false
            );
        }

        // Apply priority filter
        if (activeFilters.priorityIds.length > 0) {
            filtered = filtered.filter((task) =>
                task.priorityId ? activeFilters.priorityIds.includes(task.priorityId) : false
            );
        }

        // Group tasks
        const groups: GroupedTasks = {
            overdue: [],
            recent: [],
            tomorrow: [],
            upcoming: [],
            completed: [],
        };

        filtered.forEach((task) => {
            if (isCompleted(task)) {
                groups.completed.push(task);
            } else if (task.dueDate && isOverdue(task.dueDate)) {
                groups.overdue.push(task);
            } else if (!task.dueDate || isToday(task.dueDate)) {
                groups.recent.push(task);
            } else if (isTomorrow(task.dueDate)) {
                groups.tomorrow.push(task);
            } else if (isFuture(task.dueDate)) {
                groups.upcoming.push(task);
            }
        });

        // Sort each group
        groups.overdue.sort(
            (a, b) =>
                new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
        );
        groups.recent.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        groups.tomorrow.sort(
            (a, b) =>
                new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
        );
        groups.upcoming.sort(
            (a, b) =>
                new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
        );
        groups.completed.sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        return groups;
    }, [tasks, searchQuery, activeFilters]);

    // Toggle group expansion
    const toggleGroup = (group: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [group]: !prev[group],
        }));
    };

    // Handle task press
    const handleTaskPress = (task: Task) => {
        router.push(`/tasks/${task.id}`);
    };

    // Handle task creation
    const handleCreateTask = async (payload: CreateTaskData) => {
        // This will be handled by TaskModal's internal logic
        // After creation, refresh the list
        await loadTasks();
        return {} as Task; // Return empty task as modal handles its own creation
    };

    // Count active filters
    const activeFilterCount =
        activeFilters.statusIds.length + activeFilters.priorityIds.length;

    // Calculate total incomplete tasks
    const totalIncompleteTasks =
        groupedTasks.overdue.length +
        groupedTasks.recent.length +
        groupedTasks.tomorrow.length +
        groupedTasks.upcoming.length;

    // Loading state
    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#60A5FA" />
                    <Text className="text-gray-400 mt-4">Loading tasks...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <View className="flex-1 justify-center items-center px-6">
                    <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    <Text className="text-white text-lg mt-4 text-center">
                        Failed to load tasks
                    </Text>
                    <Text className="text-gray-400 text-sm mt-2 text-center">
                        {error}
                    </Text>
                    <Button
                        title="Retry"
                        onPress={() => {
                            setLoading(true);
                            Promise.all([loadTasks(), loadFilters()]).finally(() =>
                                setLoading(false)
                            );
                        }}
                        variant="primary"
                        className="mt-6"
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            {/* Header */}
            <View className="px-4 pt-2 pb-4">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-white text-2xl font-bold">Tasks</Text>

                    {/* List / Calendar Toggle */}
                    <View className="flex-row items-center bg-gray-800 rounded-xl p-1">
                        <TouchableOpacity
                            onPress={() => setViewMode("list")}
                            className={`px-3 py-1.5 rounded-lg ${
                                viewMode === "list" ? "bg-blue-600" : ""
                            }`}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="list"
                                size={18}
                                color={viewMode === "list" ? "#fff" : "#9CA3AF"}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setViewMode("calendar")}
                            className={`px-3 py-1.5 rounded-lg ${
                                viewMode === "calendar" ? "bg-blue-600" : ""
                            }`}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="calendar"
                                size={18}
                                color={viewMode === "calendar" ? "#fff" : "#9CA3AF"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Search and Filter Row — only in list mode */}
                {viewMode === "list" && (
                <View className="flex-row items-center gap-2">
                    {/* Search Bar */}
                    <View className="flex-1 flex-row items-center bg-gray-800 rounded-xl px-4  border border-gray-700">
                        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
                        <TextInput
                            className="flex-1 text-white ml-2"
                            placeholder="Search tasks..."
                            placeholderTextColor="#6B7280"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={18} color="#6B7280" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Filter Button */}
                    <TouchableOpacity
                        onPress={() => setFilterModalVisible(true)}
                        className={`flex-row items-center px-4 py-3 rounded-xl border ${activeFilterCount > 0
                                ? "bg-blue-600 border-blue-500"
                                : "bg-gray-800 border-gray-700"
                            }`}
                    >
                        <Ionicons
                            name="options-outline"
                            size={18}
                            color={activeFilterCount > 0 ? "#fff" : "#9CA3AF"}
                        />
                        {activeFilterCount > 0 && (
                            <View className="ml-2 bg-white/20 px-2 py-0.5 rounded-full">
                                <Text className="text-white text-xs font-semibold">
                                    {activeFilterCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
                )}

                {/* Active Filter Chips — only in list mode */}
                {viewMode === "list" && activeFilterCount > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-3">
                        {activeFilters.statusIds.map((statusId) => {
                            const status = statuses.find((s) => s.id === statusId);
                            if (!status) return null;
                            return (
                                <TouchableOpacity
                                    key={statusId}
                                    onPress={() =>
                                        setActiveFilters((prev) => ({
                                            ...prev,
                                            statusIds: prev.statusIds.filter((id) => id !== statusId),
                                        }))
                                    }
                                    className="flex-row items-center bg-blue-600/30 border border-blue-500/50 px-3 py-1 rounded-full"
                                >
                                    <Text className="text-blue-300 text-xs mr-1">
                                        {status.name}
                                    </Text>
                                    <Ionicons name="close" size={12} color="#93C5FD" />
                                </TouchableOpacity>
                            );
                        })}
                        {activeFilters.priorityIds.map((priorityId) => {
                            const priority = priorities.find((p) => p.id === priorityId);
                            if (!priority) return null;
                            return (
                                <TouchableOpacity
                                    key={priorityId}
                                    onPress={() =>
                                        setActiveFilters((prev) => ({
                                            ...prev,
                                            priorityIds: prev.priorityIds.filter(
                                                (id) => id !== priorityId
                                            ),
                                        }))
                                    }
                                    className="flex-row items-center bg-blue-600/30 border border-blue-500/50 px-3 py-1 rounded-full"
                                >
                                    <Text className="text-blue-300 text-xs mr-1">
                                        {priority.name}
                                    </Text>
                                    <Ionicons name="close" size={12} color="#93C5FD" />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Calendar View Mode */}
            {viewMode === "calendar" ? (
            <ScrollView
                className="flex-1 px-4"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#60A5FA"]}
                        tintColor="#60A5FA"
                    />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <CalendarView
                    tasks={tasks}
                    onTaskPress={handleTaskPress}
                    onRefresh={onRefresh}
                />
            </ScrollView>
            ) : (
            /* List View Mode */
            <ScrollView
                className="flex-1 px-4"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#60A5FA"]}
                        tintColor="#60A5FA"
                    />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Empty State */}
                {totalIncompleteTasks === 0 && groupedTasks.completed.length === 0 && (
                    <View className="py-16 items-center">
                        <Ionicons name="checkmark-done-circle-outline" size={64} color="#6B7280" />
                        <Text className="text-white text-lg font-semibold mt-4">
                            {searchQuery || activeFilterCount > 0
                                ? "No tasks found"
                                : "All caught up!"}
                        </Text>
                        <Text className="text-gray-400 text-sm mt-2 text-center px-8">
                            {searchQuery || activeFilterCount > 0
                                ? "Try adjusting your search or filters"
                                : "Create a new task to get started"}
                        </Text>
                        {!searchQuery && activeFilterCount === 0 && (
                            <Button
                            title="Create Task"
                            onPress={() => setTaskModalVisible(true)}
                            variant="primary"
                            icon="add"
                            className="mt-6"
                        />
                    )}
                </View>
            )}

                {/* Overdue Group */}
                {groupedTasks.overdue.length > 0 && (
                    <TaskGroup
                        title="Overdue"
                        icon="alert-circle"
                        color={GROUP_CONFIG.overdue.color}
                        bgColor={GROUP_CONFIG.overdue.bgColor}
                        tasks={groupedTasks.overdue}
                        expanded={expandedGroups.overdue}
                        onToggle={() => toggleGroup("overdue")}
                        onTaskPress={handleTaskPress}
                        showOverdueDays={true}
                    />
                )}

                {/* Recent Group */}
                {(groupedTasks.recent.length > 0 ) && (
                    <TaskGroup
                        title="Recent"
                        icon="time"
                        color={GROUP_CONFIG.recent.color}
                        bgColor={GROUP_CONFIG.recent.bgColor}
                        tasks={groupedTasks.recent}
                        expanded={expandedGroups.recent}
                        onToggle={() => toggleGroup("recent")}
                        onTaskPress={handleTaskPress}
                    />
                )}

                {/* Tomorrow Group */}
                {groupedTasks.tomorrow.length > 0 && (
                    <TaskGroup
                        title="Tomorrow"
                        icon="sunny-outline"
                        color={GROUP_CONFIG.tomorrow.color}
                        bgColor={GROUP_CONFIG.tomorrow.bgColor}
                        tasks={groupedTasks.tomorrow}
                        expanded={expandedGroups.tomorrow}
                        onToggle={() => toggleGroup("tomorrow")}
                        onTaskPress={handleTaskPress}
                    />
                )}

                {/* Upcoming Group */}
                {groupedTasks.upcoming.length > 0 && (
                    <TaskGroup
                        title="Upcoming"
                        icon="calendar-outline"
                        color={GROUP_CONFIG.upcoming.color}
                        bgColor={GROUP_CONFIG.upcoming.bgColor}
                        tasks={groupedTasks.upcoming}
                        expanded={expandedGroups.upcoming}
                        onToggle={() => toggleGroup("upcoming")}
                        onTaskPress={handleTaskPress}
                    />
                )}

                {/* Completed Group */}
                {groupedTasks.completed.length > 0 && (
                    <TaskGroup
                        title="Completed"
                        icon="checkmark-done-circle"
                        color={GROUP_CONFIG.completed.color}
                        bgColor={GROUP_CONFIG.completed.bgColor}
                        tasks={groupedTasks.completed}
                        expanded={expandedGroups.completed}
                        onToggle={() => toggleGroup("completed")}
                        onTaskPress={handleTaskPress}
                        defaultCollapsed={true}
                    />
                )}
            </ScrollView>
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                onPress={() => setTaskModalVisible(true)}
                className="absolute bottom-6 right-6 bg-blue-600 rounded-full w-14 h-14 items-center justify-center shadow-lg"
                style={{
                    shadowColor: "#2563EB",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 8,
                }}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Filter Modal */}
            <FilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                statuses={statuses}
                priorities={priorities}
                activeFilters={activeFilters}
                onApply={setActiveFilters}
            />

            {/* Task Creation Modal */}
            <TaskModal
                visible={taskModalVisible}
                onClose={() => setTaskModalVisible(false)}
                onSave={async (payload) => {
                    try {
                        const { createTask } = await import("@/src/services/taskService");
                        const newTask = await createTask(payload);
                        setTaskModalVisible(false);
                        await loadTasks();
                        return newTask;
                    } catch (err) {
                        throw err;
                    }
                }}
                initialValues={{
                    title: "",
                    description: "",
                    statusId: statuses[0]?.id || "",
                    priorityId: priorities[0]?.id || "",
                }}
                statuses={statuses}
                setStatuses={setStatuses}
                priorities={priorities}
                setPriorities={setPriorities}
            />
        </SafeAreaView>
    );
}
