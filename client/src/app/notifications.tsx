import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Swipeable from "react-native-gesture-handler/Swipeable";
import {
  archiveNotification,
  deleteNotification,
  getNotifications,
  InAppNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  unarchiveNotification,
} from "../services/userService";
import { acceptProjectInvite, declineProjectInvite } from "../services/projectService";
import useToast from "../hooks/useToast";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterType = "all" | "invite" | "comment" | "assign" | "alert" | "archived";

interface NotificationMeta {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  badgeStyle: string;
  tag: string;
  tagStyle: string;
  tagTextStyle: string;
  filterKey: FilterType;
}

interface SectionData {
  title: string;
  data: InAppNotification[];
}

// ─── Static config (outside component — no useCallback needed) ────────────────

const NOTIFICATION_META: Record<string, NotificationMeta> = {
  PROJECT_INVITE_RECEIVED: {
    icon: "mail-open-outline",
    iconColor: "#a78bfa",
    badgeStyle: "bg-purple-500/15",
    tag: "Invite",
    tagStyle: "bg-purple-500/15",
    tagTextStyle: "text-purple-300",
    filterKey: "invite",
  },
  PROJECT_MEMBER_ADDED: {
    icon: "people-outline",
    iconColor: "#a78bfa",
    badgeStyle: "bg-purple-500/15",
    tag: "Invite",
    tagStyle: "bg-purple-500/15",
    tagTextStyle: "text-purple-300",
    filterKey: "invite",
  },
  PROJECT_INVITE_ACCEPTED: {
    icon: "people-outline",
    iconColor: "#a78bfa",
    badgeStyle: "bg-purple-500/15",
    tag: "Invite",
    tagStyle: "bg-purple-500/15",
    tagTextStyle: "text-purple-300",
    filterKey: "invite",
  },
  PROJECT_INVITE_DECLINED: {
    icon: "close-circle-outline",
    iconColor: "#f59e0b",
    badgeStyle: "bg-amber-500/15",
    tag: "Invite",
    tagStyle: "bg-amber-500/15",
    tagTextStyle: "text-amber-300",
    filterKey: "invite",
  },
  COMMENT_ADDED: {
    icon: "chatbubble-ellipses-outline",
    iconColor: "#60a5fa",
    badgeStyle: "bg-blue-500/15",
    tag: "Comment",
    tagStyle: "bg-blue-500/15",
    tagTextStyle: "text-blue-300",
    filterKey: "comment",
  },
  TASK_ASSIGNED: {
    icon: "checkbox-outline",
    iconColor: "#34d399",
    badgeStyle: "bg-emerald-500/15",
    tag: "Assigned",
    tagStyle: "bg-emerald-500/15",
    tagTextStyle: "text-emerald-300",
    filterKey: "assign",
  },
  DEPLOYMENT_FAILED: {
    icon: "alert-circle-outline",
    iconColor: "#f87171",
    badgeStyle: "bg-red-500/15",
    tag: "Alert",
    tagStyle: "bg-red-500/15",
    tagTextStyle: "text-red-300",
    filterKey: "alert",
  },
  DEFAULT: {
    icon: "notifications-outline",
    iconColor: "#9ca3af",
    badgeStyle: "bg-gray-700/60",
    tag: "Update",
    tagStyle: "bg-gray-700/60",
    tagTextStyle: "text-gray-400",
    filterKey: "alert",
  },
};

const getNotificationMeta = (type: string): NotificationMeta =>
  NOTIFICATION_META[type] ?? NOTIFICATION_META.DEFAULT;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getDateGroup = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  if (date >= startOfWeek) return "This week";
  return "Older";
};

const GROUP_ORDER = ["Today", "Yesterday", "This week", "Older"];

const groupNotifications = (notifications: InAppNotification[]): SectionData[] => {
  const groups = notifications.reduce<Record<string, InAppNotification[]>>((acc, n) => {
    const key = getDateGroup(n.createdAt);
    (acc[key] ??= []).push(n);
    return acc;
  }, {});

  return GROUP_ORDER.filter((g) => groups[g]?.length).map((g) => ({
    title: g,
    data: groups[g],
  }));
};

// ─── Filter chips config ──────────────────────────────────────────────────────

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "invite", label: "Invites" },
  { key: "comment", label: "Comments" },
  { key: "assign", label: "Assigned" },
  { key: "alert", label: "Alerts" },
  { key: "archived", label: "Archived" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterChips({
  activeFilter,
  archivedCount,
  onSelect,
}: {
  activeFilter: FilterType;
  archivedCount: number;
  onSelect: (f: FilterType) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 12, gap: 8 }}
    >
      {FILTERS.map((f) => (
        <TouchableOpacity
          key={f.key}
          onPress={() => onSelect(f.key)}
          className={`px-3 py-1.5 rounded-full border ${
            activeFilter === f.key
              ? "bg-purple-500/10 border-purple-500/20"
              : "border-white/10 bg-transparent"
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-xs font-medium px-1 ${
              activeFilter === f.key ? "text-purple-300" : "text-gray-400"
            }`}
          >
            {f.label}
          </Text>

          {f.key === "archived" && archivedCount > 0 && (
            <View className="px-1.5 py-0.5 rounded-full bg-blue-500/20 ml-1">
              <Text className="text-[10px] font-semibold text-blue-300">{archivedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function SwipeActions({
  onArchiveOrRestore,
  onDelete,
  isArchived,
}: {
  onArchiveOrRestore: () => void;
  onDelete: () => void;
  isArchived: boolean;
}) {
  return (
    <View className="flex-row gap-2 pr-3 items-center">
      <TouchableOpacity
        onPress={onArchiveOrRestore}
        className="justify-center items-center w-20 h-full bg-blue-500/15 rounded-xl"
        activeOpacity={0.8}
      >
        <Ionicons name={isArchived ? "arrow-undo-outline" : "archive-outline"} size={18} color="#60a5fa" />
        <Text className="text-blue-300 text-xs mt-1 font-medium">{isArchived ? "Restore" : "Archive"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onDelete}
        className="justify-center items-center w-20 h-full bg-red-500/15 rounded-xl"
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={18} color="#f87171" />
        <Text className="text-red-300 text-xs mt-1 font-medium">Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { success: showSuccessToast, ToastComponent } = useToast();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [archivedCount, setArchivedCount] = useState(0);
  const [resolvingInviteId, setResolvingInviteId] = useState<string | null>(null);

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const loadNotifications = useCallback(async (archivedOnly = false) => {
    try {
      setErrorMessage(null);
      const data = await getNotifications({ unreadOnly: false, archivedOnly });
      setNotifications(data);
    } catch {
      setErrorMessage("Couldn't load notifications. Pull down to retry.");
      throw new Error("load failed");
    }
  }, []);

  const loadArchivedCount = useCallback(async () => {
    try {
      const archived = await getNotifications({ unreadOnly: false, archivedOnly: true });
      setArchivedCount(archived.length);
    } catch {
      // non-blocking badge refresh
    }
  }, []);

  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadNotifications(activeFilter === "archived"),
        loadArchivedCount(),
      ]);
    } catch {
      // error state handled in loadNotifications
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, loadArchivedCount, loadNotifications]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const onRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        loadNotifications(activeFilter === "archived"),
        loadArchivedCount(),
      ]);
    } catch {
      // error state handled in loadNotifications
    } finally {
      setIsRefreshing(false);
    }
  }, [activeFilter, loadArchivedCount, loadNotifications]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleMarkAllRead = useCallback(async () => {
    try {
      setIsUpdating(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        }))
      );
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const openNotificationTarget = useCallback(
    (item: InAppNotification) => {
      const taskId = item.data?.taskId;
      const projectId = item.data?.projectId;

      if (typeof taskId === "string" && taskId) {
        router.push(`/tasks?taskId=${taskId}`);
        return;
      }
      if (typeof projectId === "string" && projectId) {
        router.push("/projects/page");
        return;
      }

      // Fallback: no silent redirect to a random screen
      console.warn(`[NotificationsScreen] No navigation target for notification type: ${item.type}`);
    },
    [router]
  );

  const handleOpenNotification = useCallback(
    async (item: InAppNotification) => {
      // Always navigate regardless of read state
      openNotificationTarget(item);

      if (item.isRead) return;

      // Optimistic update — mark read in UI immediately
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );

      try {
        await markNotificationAsRead(item.id);
      } catch {
        // Rollback on failure
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === item.id ? { ...n, isRead: false, readAt: undefined } : n
          )
        );
      }
    },
    [openNotificationTarget]
  );

  const handleArchive = useCallback((id: string) => {
    // Optimistic remove from active list
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setArchivedCount((prev) => prev + 1);
    showSuccessToast("Notification archived");

    archiveNotification(id).catch(() => {
      // Rollback: re-fetch silently if archive fails
      Promise.all([
        loadNotifications(activeFilter === "archived"),
        loadArchivedCount(),
      ]).catch(() => {});
    });
  }, [activeFilter, loadArchivedCount, loadNotifications, showSuccessToast]);

  const handleRestore = useCallback((id: string) => {
    // Optimistic remove from archived view
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setArchivedCount((prev) => Math.max(0, prev - 1));
    showSuccessToast("Notification restored");

    unarchiveNotification(id).catch(() => {
      // Rollback: re-fetch silently if restore fails
      Promise.all([
        loadNotifications(activeFilter === "archived"),
        loadArchivedCount(),
      ]).catch(() => {});
    });
  }, [activeFilter, loadArchivedCount, loadNotifications, showSuccessToast]);

  const handleDelete = useCallback((id: string) => {
    // Optimistic remove
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (activeFilter === "archived") {
      setArchivedCount((prev) => Math.max(0, prev - 1));
    }
    showSuccessToast("Notification deleted");

    deleteNotification(id).catch(() => {
      // Rollback: re-fetch silently if delete fails
      Promise.all([
        loadNotifications(activeFilter === "archived"),
        loadArchivedCount(),
      ]).catch(() => {});
    });
  }, [activeFilter, loadArchivedCount, loadNotifications, showSuccessToast]);

  const isActionableInvite = useCallback((item: InAppNotification) => {
    return (
      item.type === "PROJECT_INVITE_RECEIVED" &&
      !item.isArchived &&
      typeof item.data?.inviteToken === "string" &&
      item.data.inviteToken.length > 0
    );
  }, []);

  const handleAcceptInvite = useCallback(async (item: InAppNotification) => {
    const inviteToken = item.data?.inviteToken;
    if (typeof inviteToken !== "string" || !inviteToken) return;

    try {
      setResolvingInviteId(item.id);
      await acceptProjectInvite(inviteToken);
      await markNotificationAsRead(item.id).catch(() => {});
      await deleteNotification(item.id).catch(() => {});
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      showSuccessToast("Invite accepted");
    } finally {
      setResolvingInviteId(null);
    }
  }, [showSuccessToast]);

  const handleDeclineInvite = useCallback(async (item: InAppNotification) => {
    const inviteToken = item.data?.inviteToken;
    if (typeof inviteToken !== "string" || !inviteToken) return;

    try {
      setResolvingInviteId(item.id);
      await declineProjectInvite(inviteToken);
      await markNotificationAsRead(item.id).catch(() => {});
      await deleteNotification(item.id).catch(() => {});
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      showSuccessToast("Invite declined");
    } finally {
      setResolvingInviteId(null);
    }
  }, [showSuccessToast]);

  // ─── Derived state ──────────────────────────────────────────────────────────

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const sections = useMemo<SectionData[]>(() => {
    const filtered =
      activeFilter === "all" || activeFilter === "archived"
        ? notifications
        : notifications.filter(
            (n) => getNotificationMeta(n.type).filterKey === activeFilter
          );
    return groupNotifications(filtered);
  }, [notifications, activeFilter]);

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <Text className="text-xs font-medium text-gray-600 uppercase tracking-widest px-5 pt-5 pb-1.5">
        {section.title}
      </Text>
    ),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: InAppNotification }) => {
      const meta = getNotificationMeta(item.type);
      const actionableInvite = isActionableInvite(item);
      const isResolvingThisInvite = resolvingInviteId === item.id;

      return (
        <Swipeable
          renderRightActions={() => (
            <SwipeActions
              onArchiveOrRestore={() => item.isArchived ? handleRestore(item.id) : handleArchive(item.id)}
              onDelete={() => handleDelete(item.id)}
              isArchived={Boolean(item.isArchived)}
            />
          )}
          overshootRight={false}
        >
          <TouchableOpacity
            onPress={() => !actionableInvite && handleOpenNotification(item)}
            disabled={actionableInvite}
            className={`flex-row items-start gap-3 px-5 py-3.5 ${
              item.isRead ? "opacity-55" : ""
            }`}
            activeOpacity={0.7}
          >
            {/* Unread accent bar */}
            {!item.isRead && (
              <View className="absolute left-0 top-2 bottom-2 w-0.5 bg-purple-500 rounded-r" />
            )}

            {/* Icon */}
            <View className={`w-9 h-9 rounded-xl items-center justify-center ${meta.badgeStyle}`}>
              <Ionicons name={meta.icon} size={17} color={meta.iconColor} />
            </View>

            {/* Content */}
            <View className="flex-1 min-w-0">
              <Text className="text-white text-sm font-semibold leading-snug">
                {item.title}
              </Text>
              <Text
                className="text-gray-400 text-xs mt-0.5 leading-relaxed"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.message}
              </Text>
              <View className="flex-row items-center gap-2 mt-1.5">
                <Text className="text-gray-600 text-xs">
                  {formatRelativeTime(item.createdAt)}
                </Text>
                <View className={`px-1.5 py-0.5 rounded ${meta.tagStyle}`}>
                  <Text className={`text-xs font-medium ${meta.tagTextStyle}`}>
                    {meta.tag}
                  </Text>
                </View>
              </View>
              {actionableInvite && (
                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    onPress={() => handleDeclineInvite(item)}
                    disabled={isResolvingThisInvite}
                    className="px-3 py-1.5 rounded-lg bg-gray-700"
                    activeOpacity={0.8}
                  >
                    <Text className="text-gray-200 text-xs font-medium">Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAcceptInvite(item)}
                    disabled={isResolvingThisInvite}
                    className="px-3 py-1.5 rounded-lg bg-purple-600"
                    activeOpacity={0.8}
                  >
                    {isResolvingThisInvite ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-white text-xs font-semibold">Accept</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Unread dot */}
            {!item.isRead && !item.isArchived && (
              <View className="w-2 h-2 rounded-full bg-purple-400 mt-1 flex-shrink-0" />
            )}
          </TouchableOpacity>
        </Swipeable>
      );
    },
    [handleAcceptInvite, handleArchive, handleDeclineInvite, handleDelete, handleOpenNotification, handleRestore, isActionableInvite, resolvingInviteId]
  );

  const renderEmpty = useCallback(() => {
    if (errorMessage) {
      return (
        <View className="mt-24 items-center px-8">
          <View className="w-14 h-14 rounded-2xl bg-red-500/15 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={24} color="#f87171" />
          </View>
          <Text className="text-red-300 font-semibold text-base text-center">
            Couldn't load notifications
          </Text>
          <Text className="text-gray-500 text-sm text-center mt-1">{errorMessage}</Text>
          <TouchableOpacity
            onPress={initialize}
            className="mt-5 px-5 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/35"
          >
            <Text className="text-purple-300 font-semibold text-sm">Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="mt-24 items-center px-8">
        <View className="w-14 h-14 rounded-2xl bg-gray-800 items-center justify-center mb-4">
          <Ionicons name="notifications-off-outline" size={24} color="#4b5563" />
        </View>
        <Text className="text-gray-300 font-semibold text-base">
          {activeFilter === "all"
            ? "No notifications yet"
            : activeFilter === "archived"
            ? "No archived notifications"
            : `No ${activeFilter} notifications`}
        </Text>
        <Text className="text-gray-600 text-sm text-center mt-1">
          {activeFilter === "all"
            ? "Invites, assignments, and comments will appear here."
            : activeFilter === "archived"
            ? "Archived notifications will appear here."
            : "Switch filters or check back later."}
        </Text>
        {activeFilter === "all" && (
          <TouchableOpacity
            onPress={() => router.push("/tasks")}
            className="mt-5 px-5 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/35"
          >
            <Text className="text-purple-300 font-semibold text-sm">Go to tasks</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [errorMessage, activeFilter, initialize, router]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="pt-5 pb-3 px-5 border-b border-white/5">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-xl font-bold text-white">Notifications</Text>
            {unreadCount > 0 && (
              <View className="px-2 py-0.5 rounded-full bg-purple-600">
                <Text className="text-xs font-semibold text-purple-100">
                  {unreadCount} new
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            disabled={activeFilter === "archived" || unreadCount === 0 || isUpdating}
            onPress={handleMarkAllRead}
            className={`px-3 py-1.5 rounded-lg ${
              activeFilter === "archived" || unreadCount === 0 || isUpdating
                ? "bg-white/5 border border-white/10"
                : "bg-purple-500/15 border border-purple-500/30"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeFilter === "archived" || unreadCount === 0 || isUpdating ? "text-gray-300" : "text-purple-300"
              }`}
            >
              {activeFilter === "archived"
                ? "Archived"
                : isUpdating
                ? "Updating…"
                : unreadCount > 0
                ? `Mark ${unreadCount} read`
                : "All read"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        <FilterChips
          activeFilter={activeFilter}
          archivedCount={archivedCount}
          onSelect={setActiveFilter}
        />
      </View>

      {/* Body */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#a78bfa" size="large" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={renderEmpty}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#a78bfa"
            />
          }
        />
      )}

      {ToastComponent}
    </SafeAreaView>
  );
}