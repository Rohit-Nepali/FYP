import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Image,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Task } from "../services/taskService";
import {
    getCalendarConnectionStatus,
    getCalendarEvents,
    CalendarEvent,
    CalendarConnectionStatus,
} from "../services/calendarService";
import { resolveFileUrl } from "@/src/utils/url";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalendarViewProps {
    tasks: Task[];
    onTaskPress: (task: Task) => void;
    onRefresh?: () => void;
}

interface DayItem {
    type: "task" | "event";
    task?: Task;
    event?: CalendarEvent;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toDateKey = (dateString: string): string => {
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatTime = (dateTimeString: string): string => {
    const d = new Date(dateTimeString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const isCompleted = (task: Task): boolean => {
    return Boolean(task.isCompleted);
};

// ─── Calendar Theme ──────────────────────────────────────────────────────────

const calendarTheme = {
    backgroundColor: "transparent",
    calendarBackground: "transparent",
    textSectionTitleColor: "#9CA3AF",
    selectedDayBackgroundColor: "#2563EB",
    selectedDayTextColor: "#FFFFFF",
    todayTextColor: "#60A5FA",
    todayBackgroundColor: "rgba(96, 165, 250, 0.15)",
    dayTextColor: "#E5E7EB",
    textDisabledColor: "#4B5563",
    monthTextColor: "#FFFFFF",
    arrowColor: "#60A5FA",
    textDayFontWeight: "500" as const,
    textMonthFontWeight: "700" as const,
    textDayHeaderFontWeight: "600" as const,
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 12,
};

// ─── Task Card (for the agenda section) ──────────────────────────────────────

const AgendaTaskCard: React.FC<{ task: Task; onPress: () => void }> = ({
    task,
    onPress,
}) => {
    const priorityColor =
        task.priority?.color ||
        (task.priority?.name === "High"
            ? "#F43F5E"
            : task.priority?.name === "Medium"
                ? "#F59E0B"
                : "#10B981");
    const done = isCompleted(task);

    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-gray-800 rounded-xl p-4 mb-2 flex-row items-center"
            activeOpacity={0.7}
        >
            {/* Status dot */}
            <View
                className="w-2.5 h-2.5 rounded-full mr-3"
                style={{ backgroundColor: done ? "#10B981" : "#8B5CF6" }}
            />

            {/* Content */}
            <View className="flex-1">
                <Text
                    className={`font-semibold text-sm ${done ? "text-gray-500 line-through" : "text-white"
                        }`}
                    numberOfLines={1}
                >
                    {task.title}
                </Text>
                <View className="flex-row items-center mt-1 gap-2">
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
                    {task.status && (
                        <Text className="text-gray-500 text-xs">
                            {task.status.name}
                        </Text>
                    )}
                </View>
            </View>

            {/* Assignee */}
            {task.assignee && (
                <View className="ml-2">
                    {task.assignee.profileImage ? (
                        <Image
                            source={{ uri: resolveFileUrl(task.assignee.profileImage) }}
                            className="w-7 h-7 rounded-full"
                        />
                    ) : (
                        <View
                            className="w-7 h-7 rounded-full items-center justify-center bg-gray-700"
                        >
                            <Text className="text-white text-xs font-semibold">
                                {task.assignee.name?.charAt(0)?.toUpperCase() || "?"}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            <Ionicons
                name="chevron-forward"
                size={14}
                color="#6B7280"
                style={{ marginLeft: 4 }}
            />
        </TouchableOpacity>
    );
};

// ─── Google Event Card (for the agenda section) ──────────────────────────────

const AgendaEventCard: React.FC<{ event: CalendarEvent }> = ({ event }) => {
    return (
        <View className="bg-gray-800/60 rounded-xl p-4 mb-2 flex-row items-center border border-blue-500/20">
            <View
                className="w-2.5 h-2.5 rounded-full mr-3"
                style={{ backgroundColor: "#3B82F6" }}
            />
            <View className="flex-1">
                <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                    {event.summary}
                </Text>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="logo-google" size={10} color="#3B82F6" />
                    <Text className="text-blue-400 text-xs ml-1">Google Calendar</Text>
                    {event.start?.dateTime && (
                        <Text className="text-gray-500 text-xs ml-2">
                            {formatTime(event.start.dateTime)}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const CalendarView: React.FC<CalendarViewProps> = ({
    tasks,
    onTaskPress,
}) => {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<string>(toDateKey(new Date().toISOString()));
    const [calendarStatus, setCalendarStatus] = useState<CalendarConnectionStatus>({ connected: false });
    const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    // Check calendar connection and fetch events
    useEffect(() => {
        const loadCalendarData = async () => {
            try {
                const status = await getCalendarConnectionStatus();
                setCalendarStatus(status);

                if (status.connected) {
                    setLoadingEvents(true);
                    // Fetch events for this month ± 1 month
                    const now = new Date();
                    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                    const events = await getCalendarEvents(
                        startOfPrevMonth.toISOString(),
                        endOfNextMonth.toISOString()
                    );
                    setGoogleEvents(events || []);
                }
            } catch (error) {
                console.error("Error loading calendar data:", error);
            } finally {
                setLoadingEvents(false);
            }
        };
        loadCalendarData();
    }, []);

    // Build markedDates for the calendar
    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};

        // Mark tasks with purple dots
        tasks.forEach((task) => {
            if (!task.dueDate) return;
            const key = toDateKey(task.dueDate);
            if (!marks[key]) {
                marks[key] = { dots: [], marked: true };
            }
            // Only add one purple dot per date
            const hasPurple = marks[key].dots.some((d: any) => d.key === "task");
            if (!hasPurple) {
                marks[key].dots.push({
                    key: "task",
                    color: "#8B5CF6",
                    selectedDotColor: "#8B5CF6",
                });
            }
        });

        // Mark Google events with blue dots
        googleEvents.forEach((event) => {
            if (!event.start?.dateTime) return;
            const key = toDateKey(event.start.dateTime);
            if (!marks[key]) {
                marks[key] = { dots: [], marked: true };
            }
            const hasBlue = marks[key].dots.some((d: any) => d.key === "event");
            if (!hasBlue) {
                marks[key].dots.push({
                    key: "event",
                    color: "#3B82F6",
                    selectedDotColor: "#3B82F6",
                });
            }
        });

        // Mark selected date
        if (marks[selectedDate]) {
            marks[selectedDate] = {
                ...marks[selectedDate],
                selected: true,
                selectedColor: "#2563EB",
            };
        } else {
            marks[selectedDate] = {
                selected: true,
                selectedColor: "#2563EB",
                dots: [],
            };
        }

        return marks;
    }, [tasks, googleEvents, selectedDate]);

    // Items for the selected date
    const selectedDayItems = useMemo<DayItem[]>(() => {
        const items: DayItem[] = [];

        // Tasks due on the selected date
        tasks.forEach((task) => {
            if (!task.dueDate) return;
            if (toDateKey(task.dueDate) === selectedDate) {
                items.push({ type: "task", task });
            }
        });

        // Google events on the selected date
        googleEvents.forEach((event) => {
            if (!event.start?.dateTime) return;
            if (toDateKey(event.start.dateTime) === selectedDate) {
                items.push({ type: "event", event });
            }
        });

        return items;
    }, [tasks, googleEvents, selectedDate]);

    const handleDayPress = useCallback((day: DateData) => {
        setSelectedDate(day.dateString);
    }, []);

    // Format selected date for display
    const formattedSelectedDate = useMemo(() => {
        const d = new Date(selectedDate + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (d.getTime() === today.getTime()) return "Today";
        if (d.getTime() === tomorrow.getTime()) return "Tomorrow";

        return d.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
        });
    }, [selectedDate]);

    return (
        <View className="flex-1">
            {/* Google Calendar Connection Banner */}
            {!calendarStatus.connected && (
                <TouchableOpacity
                    onPress={() => router.push("/settings/CalendarSettings")}
                    className="mx-1 mb-3 flex-row items-center bg-blue-600/10 border border-blue-500/30 rounded-xl px-4 py-3"
                    activeOpacity={0.7}
                >
                    <Ionicons name="logo-google" size={16} color="#3B82F6" />
                    <Text className="text-blue-400 text-sm font-medium ml-2 flex-1">
                        Connect Google Calendar to see events
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                </TouchableOpacity>
            )}

            {/* Calendar */}
            <View className="mx-1 bg-gray-800/50 rounded-2xl overflow-hidden mb-4">
                <Calendar
                    theme={calendarTheme}
                    markingType="multi-dot"
                    markedDates={markedDates}
                    onDayPress={handleDayPress}
                    enableSwipeMonths
                    style={{
                        borderRadius: 16,
                        paddingBottom: 8,
                    }}
                />

                {/* Legend */}
                <View className="flex-row items-center justify-center gap-4 pb-3">
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-purple-500 mr-1.5" />
                        <Text className="text-gray-400 text-xs">Tasks</Text>
                    </View>
                    {calendarStatus.connected && (
                        <View className="flex-row items-center">
                            <View className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
                            <Text className="text-gray-400 text-xs">Google Calendar</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Selected Day Agenda */}
            <View className="mx-1">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white font-semibold text-base">
                        {formattedSelectedDate}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                        {selectedDayItems.length} {selectedDayItems.length === 1 ? "item" : "items"}
                    </Text>
                </View>

                {loadingEvents && (
                    <View className="py-4 items-center">
                        <ActivityIndicator size="small" color="#60A5FA" />
                    </View>
                )}

                {!loadingEvents && selectedDayItems.length === 0 && (
                    <View className="py-8 items-center bg-gray-800/30 rounded-xl">
                        <Ionicons name="calendar-outline" size={32} color="#4B5563" />
                        <Text className="text-gray-500 text-sm mt-2">
                            Nothing scheduled
                        </Text>
                    </View>
                )}

                {!loadingEvents &&
                    selectedDayItems.map((item, index) => {
                        if (item.type === "task" && item.task) {
                            return (
                                <AgendaTaskCard
                                    key={`task-${item.task.id}`}
                                    task={item.task}
                                    onPress={() => onTaskPress(item.task!)}
                                />
                            );
                        }
                        if (item.type === "event" && item.event) {
                            return (
                                <AgendaEventCard
                                    key={`event-${item.event.id}`}
                                    event={item.event}
                                />
                            );
                        }
                        return null;
                    })}
            </View>
        </View>
    );
};

export default CalendarView;
