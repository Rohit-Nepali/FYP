import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  getProjectAssignmentReport,
  AssignmentReportRow,
  getProjectById,
  ProjectAssignmentReport,
} from "@/src/services/projectService";
import { Button } from "@/src/components/UI/Buttons";

type SortKey =
  | "title"
  | "assignee"
  | "status"
  | "priority"
  | "dueDate"
  | "completion"
  | "creator";
type SortDirection = "asc" | "desc";

// ─── Summary Card Component ────────────────────────────────────────
function SummaryCard({
  icon,
  label,
  value,
  color,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  color: string;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).duration(400).easing(Easing.out(Easing.cubic))}
    >
      <View className="bg-gray-800/80 rounded-2xl border border-gray-700/50 p-4 mr-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mb-3"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text className="text-2xl font-bold text-white">{value}</Text>
        <Text className="text-gray-400 text-xs mt-1">{label}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────
function StatusBadge({ name }: { name?: string }) {
  const getStatusStyle = (status?: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("done") || s.includes("complete"))
      return { bg: "bg-emerald-500/20", text: "text-emerald-400", dot: "#34D399" };
    if (s.includes("progress") || s.includes("active"))
      return { bg: "bg-blue-500/20", text: "text-blue-400", dot: "#60A5FA" };
    if (s.includes("review"))
      return { bg: "bg-purple-500/20", text: "text-purple-400", dot: "#A78BFA" };
    if (s.includes("blocked") || s.includes("stuck"))
      return { bg: "bg-red-500/20", text: "text-red-400", dot: "#F87171" };
    return { bg: "bg-gray-500/20", text: "text-gray-400", dot: "#9CA3AF" };
  };

  const style = getStatusStyle(name);

  return (
    <View className={`flex-row items-center px-2.5 py-1.5 rounded-lg ${style.bg}`}>
      <View
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ backgroundColor: style.dot }}
      />
      <Text className={`text-xs font-medium ${style.text}`}>{name || "—"}</Text>
    </View>
  );
}

// ─── Priority Badge ────────────────────────────────────────────────
function PriorityBadge({ name }: { name?: string }) {
  const getPriorityStyle = (priority?: string) => {
    const p = priority?.toLowerCase() || "";
    if (p.includes("urgent") || p.includes("critical"))
      return { bg: "bg-red-500/20", text: "text-red-400", icon: "flame" as const };
    if (p.includes("high"))
      return { bg: "bg-orange-500/20", text: "text-orange-400", icon: "arrow-up" as const };
    if (p.includes("medium") || p.includes("normal"))
      return { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: "remove" as const };
    if (p.includes("low"))
      return { bg: "bg-green-500/20", text: "text-green-400", icon: "arrow-down" as const };
    return { bg: "bg-gray-500/20", text: "text-gray-400", icon: "remove" as const };
  };

  const style = getPriorityStyle(name);

  return (
    <View className={`flex-row items-center px-2.5 py-1.5 rounded-lg ${style.bg}`}>
      <Ionicons name={style.icon} size={12} color={style.text.replace("text-", "")} />
      <Text className={`text-xs font-medium ml-1 ${style.text}`}>{name || "—"}</Text>
    </View>
  );
}

// ─── Completion Badge ──────────────────────────────────────────────
function CompletionBadge({ isCompleted }: { isCompleted: boolean }) {
  return (
    <View
      className={`flex-row items-center px-2.5 py-1.5 rounded-lg ${isCompleted ? "bg-emerald-500/20" : "bg-amber-500/15"
        }`}
    >
      <Ionicons
        name={isCompleted ? "checkmark-circle" : "time-outline"}
        size={14}
        color={isCompleted ? "#34D399" : "#FBBF24"}
      />
      <Text
        className={`text-xs font-medium ml-1.5 ${isCompleted ? "text-emerald-400" : "text-amber-400"
          }`}
      >
        {isCompleted ? "Done" : "Pending"}
      </Text>
    </View>
  );
}

// ─── Avatar Circle ─────────────────────────────────────────────────
function AvatarCircle({ name, size = 28 }: { name?: string; size?: number }) {
  const getInitials = (n?: string) => {
    if (!n) return "?";
    return n
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getColor = (n?: string) => {
    if (!n) return "#6B7280";
    const colors = ["#60A5FA", "#34D399", "#F472B6", "#A78BFA", "#FBBF24", "#F87171"];
    const index = n.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <View
      className="items-center justify-center rounded-full mr-2"
      style={{
        width: size,
        height: size,
        backgroundColor: `${getColor(name)}25`,
        borderWidth: 1,
        borderColor: `${getColor(name)}40`,
      }}
    >
      <Text
        style={{ color: getColor(name), fontSize: size * 0.38, fontWeight: "600" }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

// ─── Sort Header Button ────────────────────────────────────────────
function SortHeader({
  label,
  sortKey: key,
  currentSortKey,
  sortDirection,
  onPress,
  width,
}: {
  label: string;
  sortKey: SortKey;
  currentSortKey: SortKey;
  sortDirection: SortDirection;
  onPress: (key: SortKey) => void;
  width: number;
}) {
  const isActive = currentSortKey === key;

  return (
    <TouchableOpacity
      style={{ width }}
      className="px-3 py-3.5"
      onPress={() => onPress(key)}
      activeOpacity={0.6}
    >
      <View className="flex-row items-center">
        <Text
          className={`text-xs font-bold uppercase tracking-wider ${isActive ? "text-blue-400" : "text-gray-400"
            }`}
        >
          {label}
        </Text>
        {isActive && (
          <View className="ml-1.5 bg-blue-500/20 rounded-full w-4 h-4 items-center justify-center">
            <Ionicons
              name={sortDirection === "asc" ? "chevron-up" : "chevron-down"}
              size={10}
              color="#60A5FA"
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Overdue Indicator ─────────────────────────────────────────────
function DueDateCell({ dateString, isCompleted }: { dateString?: string | null; isCompleted: boolean }) {
  if (!dateString) {
    return <Text className="text-gray-500 text-sm">No date</Text>;
  }

  const date = new Date(dateString);
  const now = new Date();
  const isOverdue = !isCompleted && date < now;
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow =
    date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  let label = formatted;
  if (isToday) label = "Today";
  if (isTomorrow) label = "Tomorrow";

  return (
    <View className="flex-row items-center">
      {isOverdue && (
        <Ionicons
          name="warning"
          size={12}
          color="#F87171"
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        className={`text-sm ${isOverdue
            ? "text-red-400 font-semibold"
            : isToday
              ? "text-amber-400 font-medium"
              : "text-gray-300"
          }`}
      >
        {label}
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════

export default function ProjectAssignmentReportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const [report, setReport] = useState<ProjectAssignmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  const loadReport = useCallback(
    async (projectId: string) => {
      try {
        setLoading(true);
        const project = await getProjectById(projectId);
        if (!user || project.ownerId !== user.id) {
          Alert.alert(
            "Access denied",
            "Only the project owner can view this report.",
            [{ text: "OK", onPress: () => router.back() }]
          );
          return;
        }
        const data = await getProjectAssignmentReport(projectId);
        setReport(data);
      } catch (err) {
        Alert.alert(
          "Error",
          err instanceof Error
            ? err.message
            : "Failed to load assignment report",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } finally {
        setLoading(false);
      }
    },
    [router, user]
  );

  useEffect(() => {
    if (id && typeof id === "string") {
      loadReport(id);
    }
  }, [id, loadReport]);

  const getSortableValue = (row: AssignmentReportRow, key: SortKey) => {
    switch (key) {
      case "title":
        return row.title.toLowerCase();
      case "assignee":
        return (row.assignee?.name || "zzz_unassigned").toLowerCase();
      case "status":
        return (row.status?.name || "").toLowerCase();
      case "priority":
        return (row.priority?.name || "").toLowerCase();
      case "dueDate":
        return row.dueDate
          ? new Date(row.dueDate).getTime()
          : Number.MAX_SAFE_INTEGER;
      case "completion":
        return row.isCompleted ? 1 : 0;
      case "creator":
        return (row.creator?.name || "").toLowerCase();
      default:
        return "";
    }
  };

  const sortedRows = useMemo(() => {
    if (!report) return [];
    return [...report.rows].sort((a, b) => {
      const aVal = getSortableValue(a, sortKey);
      const bVal = getSortableValue(b, sortKey);
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [report, sortDirection, sortKey]);

  const stats = useMemo(() => {
    if (!report) return { total: 0, completed: 0, pending: 0, overdue: 0 };
    const now = new Date();
    const completed = report.rows.filter((r) => r.isCompleted).length;
    const overdue = report.rows.filter(
      (r) => !r.isCompleted && r.dueDate && new Date(r.dueDate) < now
    ).length;
    return {
      total: report.totalTasks,
      completed,
      pending: report.totalTasks - completed,
      overdue,
    };
  }, [report]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950">
        <View className="flex-1 justify-center items-center">
          <View className="bg-gray-800/50 rounded-3xl p-8 items-center">
            <ActivityIndicator size="large" color="#60A5FA" />
            <Text className="text-gray-400 text-sm mt-4">
              Loading report...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error / Not Found ─────────────────────────────────────────
  if (!report) {
    return (
      <SafeAreaView className="flex-1 bg-gray-950">
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-red-500/10 rounded-full p-6 mb-4">
            <Ionicons name="alert-circle-outline" size={48} color="#F87171" />
          </View>
          <Text className="text-white text-xl font-bold mt-2">
            Report Not Found
          </Text>
          <Text className="text-gray-400 text-sm text-center mt-2">
            The assignment report could not be loaded.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="primary"
            className="mt-8"
          />
        </View>
      </SafeAreaView>
    );
  }

  const columns: { key: SortKey; label: string; width: number }[] = [
    { key: "title", label: "Task", width: 220 },
    { key: "assignee", label: "Assignee", width: 170 },
    { key: "status", label: "Status", width: 140 },
    { key: "priority", label: "Priority", width: 130 },
    { key: "dueDate", label: "Due", width: 120 },
    { key: "completion", label: "State", width: 110 },
    { key: "creator", label: "Creator", width: 170 },
  ];

  // ─── Card View Render ──────────────────────────────────────────
  const renderCardView = () => (
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {sortedRows.map((row, index) => (
        <Animated.View
          key={row.id}
          entering={FadeInDown.delay(index * 50)
            .springify()
            .damping(10)}
        >
          <View
            className={`bg-gray-800/70 rounded-2xl border mb-3 overflow-hidden ${row.isCompleted
                ? "border-gray-700/30"
                : !row.isCompleted &&
                  row.dueDate &&
                  new Date(row.dueDate) < new Date()
                  ? "border-red-500/30"
                  : "border-gray-700/50"
              }`}
          >
            {/* Overdue accent bar */}
            {!row.isCompleted &&
              row.dueDate &&
              new Date(row.dueDate) < new Date() && (
                <View className="h-0.5 bg-red-500/60" />
              )}

            <View className="p-4">
              {/* Top Row: Title + Completion */}
              <View className="flex-row items-start justify-between mb-3">
                <Text
                  className={`text-base font-semibold flex-1 mr-3 ${row.isCompleted
                      ? "text-gray-400 line-through"
                      : "text-white"
                    }`}
                  numberOfLines={2}
                >
                  {row.title}
                </Text>
                <CompletionBadge isCompleted={row.isCompleted} />
              </View>

              {/* Badges Row */}
              <View className="flex-row flex-wrap gap-2 mb-3">
                <StatusBadge name={row.status?.name} />
                <PriorityBadge name={row.priority?.name} />
              </View>

              {/* Bottom Row: People + Date */}
              <View className="flex-row items-center justify-between pt-2 border-t border-gray-700/40">
                <View className="flex-row items-center flex-1">
                  <AvatarCircle name={row.assignee?.name} />
                  <View className="flex-1">
                    <Text
                      className="text-gray-300 text-sm font-medium"
                      numberOfLines={1}
                    >
                      {row.assignee?.name || "Unassigned"}
                    </Text>
                    {row.creator?.name && (
                      <Text className="text-gray-500 text-xs" numberOfLines={1}>
                        by {row.creator.name}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color="#6B7280"
                    style={{ marginRight: 4 }}
                  />
                  <DueDateCell
                    dateString={row.dueDate}
                    isCompleted={row.isCompleted}
                  />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );

  // ─── Table View Render ─────────────────────────────────────────
  const renderTableView = () => (
    <ScrollView
      className="flex-1 px-4 pb-4"
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
          {/* Header */}
          <View className="flex-row bg-gray-800 border-b border-gray-700/60">
            {columns.map((column) => (
              <SortHeader
                key={column.key}
                label={column.label}
                sortKey={column.key}
                currentSortKey={sortKey}
                sortDirection={sortDirection}
                onPress={handleSort}
                width={column.width}
              />
            ))}
          </View>

          {/* Rows */}
          {sortedRows.map((row, index) => (
            <Animated.View
              key={row.id}
              entering={FadeInDown.delay(index * 30).springify()}
              className={`flex-row border-b border-gray-700/30 ${index % 2 === 0 ? "bg-gray-800/30" : "bg-transparent"
                }`}
            >
              <View
                style={{ width: columns[0].width }}
                className="px-3 py-3.5"
              >
                <Text
                  className={`text-sm font-medium ${row.isCompleted
                      ? "text-gray-500 line-through"
                      : "text-white"
                    }`}
                  numberOfLines={2}
                >
                  {row.title}
                </Text>
              </View>

              <View
                style={{ width: columns[1].width }}
                className="px-3 py-3.5"
              >
                <View className="flex-row items-center">
                  <AvatarCircle name={row.assignee?.name} size={24} />
                  <Text
                    className="text-gray-300 text-sm flex-1"
                    numberOfLines={1}
                  >
                    {row.assignee?.name || "Unassigned"}
                  </Text>
                </View>
              </View>

              <View
                style={{ width: columns[2].width }}
                className="px-3 py-3.5 justify-center"
              >
                <StatusBadge name={row.status?.name} />
              </View>

              <View
                style={{ width: columns[3].width }}
                className="px-3 py-3.5 justify-center"
              >
                <PriorityBadge name={row.priority?.name} />
              </View>

              <View
                style={{ width: columns[4].width }}
                className="px-3 py-3.5 justify-center"
              >
                <DueDateCell
                  dateString={row.dueDate}
                  isCompleted={row.isCompleted}
                />
              </View>

              <View
                style={{ width: columns[5].width }}
                className="px-3 py-3.5 justify-center"
              >
                <CompletionBadge isCompleted={row.isCompleted} />
              </View>

              <View
                style={{ width: columns[6].width }}
                className="px-3 py-3.5"
              >
                <View className="flex-row items-center">
                  <AvatarCircle name={row.creator?.name} size={24} />
                  <Text
                    className="text-gray-300 text-sm flex-1"
                    numberOfLines={1}
                  >
                    {row.creator?.name || "—"}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.springify()}>
        <LinearGradient
          colors={["rgba(30,41,59,0.8)", "rgba(3,7,18,0)"]}
          className="pb-4"
        >
          <View className="px-5 pt-4 pb-2">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-gray-800/60 rounded-xl p-2"
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>

              <View className="flex-row bg-gray-800/60 rounded-xl p-1">
                <TouchableOpacity
                  onPress={() => setViewMode("cards")}
                  className={`px-3 py-1.5 rounded-lg ${viewMode === "cards" ? "bg-blue-500/30" : ""
                    }`}
                >
                  <Ionicons
                    name="grid-outline"
                    size={18}
                    color={viewMode === "cards" ? "#60A5FA" : "#9CA3AF"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg ${viewMode === "table" ? "bg-blue-500/30" : ""
                    }`}
                >
                  <Ionicons
                    name="list-outline"
                    size={18}
                    color={viewMode === "table" ? "#60A5FA" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                Assignment Report
              </Text>
              <Text
                className="text-white text-2xl font-bold mt-1"
                numberOfLines={2}
              >
                {report.project.title}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ─── Summary Cards ───────────────────────────────────────── */}
      <View className="px-4 mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          <SummaryCard
            icon="documents-outline"
            label="Total Tasks"
            value={stats.total}
            color="#60A5FA"
            index={0}
          />
          <SummaryCard
            icon="checkmark-circle-outline"
            label="Completed"
            value={stats.completed}
            color="#34D399"
            index={1}
          />
          <SummaryCard
            icon="time-outline"
            label="Pending"
            value={stats.pending}
            color="#FBBF24"
            index={2}
          />
          <SummaryCard
            icon="warning-outline"
            label="Overdue"
            value={stats.overdue}
            color="#F87171"
            index={3}
          />
        </ScrollView>
      </View>

      {/* ─── Sort Controls (Card View) ───────────────────────────── */}
      {viewMode === "cards" && (
        <View className="px-4 mb-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {(
              [
                { key: "dueDate", label: "Due Date" },
                { key: "priority", label: "Priority" },
                { key: "assignee", label: "Assignee" },
                { key: "status", label: "Status" },
                { key: "completion", label: "State" },
              ] as { key: SortKey; label: string }[]
            ).map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => handleSort(item.key)}
                className={`flex-row items-center px-3 py-2 rounded-xl border ${sortKey === item.key
                    ? "bg-blue-500/15 border-blue-500/30"
                    : "bg-gray-800/40 border-gray-700/40"
                  }`}
              >
                <Text
                  className={`text-xs font-medium ${sortKey === item.key ? "text-blue-400" : "text-gray-400"
                    }`}
                >
                  {item.label}
                </Text>
                {sortKey === item.key && (
                  <Ionicons
                    name={
                      sortDirection === "asc" ? "chevron-up" : "chevron-down"
                    }
                    size={12}
                    color="#60A5FA"
                    style={{ marginLeft: 4 }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ─── Empty State ─────────────────────────────────────────── */}
      {report.rows.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-gray-800/30 rounded-3xl p-8 items-center">
            <View className="bg-gray-700/30 rounded-full p-6 mb-4">
              <Ionicons
                name="document-text-outline"
                size={40}
                color="#4B5563"
              />
            </View>
            <Text className="text-gray-300 text-base font-semibold">
              No Tasks Yet
            </Text>
            <Text className="text-gray-500 text-sm text-center mt-2">
              Tasks assigned in this project will appear here.
            </Text>
          </View>
        </View>
      ) : viewMode === "cards" ? (
        renderCardView()
      ) : (
        renderTableView()
      )}
    </SafeAreaView>
  );
}