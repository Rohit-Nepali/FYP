import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Task, getAllTasks } from "@/src/services/taskService";
import {
  MessageClassification,
  ProductivityLabel,
  sendChatbotMessage,
} from "@/src/services/chatbotService";

// Types
interface ChatMessage {
  id: string;
  type: "bot" | "user";
  content: string;
  timestamp: Date;
  classification?: MessageClassification | null;
  taskData?: {
    taskId: string;
    taskTitle: string;
    priority: string;
    daysOverdue?: number;
  };
  quickActions?: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  action: "view_task" | "mark_complete" | "snooze" | "remind_later";
  taskId?: string;
}

const PRODUCTIVITY_BADGE_MAP: Record<
  ProductivityLabel,
  { text: string; classes: string }
> = {
  HIGH_MOTIVATION: {
    text: "High motivation",
    classes: "bg-emerald-500/20 border border-emerald-400/40 text-emerald-200",
  },
  CONSISTENT_PRODUCTIVITY: {
    text: "Consistent productivity",
    classes: "bg-teal-500/20 border border-teal-400/40 text-teal-200",
  },
  LOW_ENERGY: {
    text: "Low energy",
    classes: "bg-slate-500/20 border border-slate-300/40 text-slate-100",
  },
  WORK_OVERLOAD: {
    text: "Work overload",
    classes: "bg-red-500/20 border border-red-400/40 text-red-200",
  },
  DISTRACTION: {
    text: "Distraction",
    classes: "bg-yellow-500/20 border border-yellow-400/40 text-yellow-200",
  },
  PROCRASTINATION: {
    text: "Procrastination",
    classes: "bg-orange-500/20 border border-orange-400/40 text-orange-200",
  },
  POOR_PLANNING: {
    text: "Poor planning",
    classes: "bg-indigo-500/20 border border-indigo-400/40 text-indigo-200",
  },
  FORGETFULNESS: {
    text: "Forgetfulness",
    classes: "bg-purple-500/20 border border-purple-400/40 text-purple-200",
  },
};

// Helper function to check if task is overdue
const isOverdue = (dueDate: string | undefined): boolean => {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(dueDate);
  taskDate.setHours(0, 0, 0, 0);
  return taskDate < today;
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

const isCompleted = (task: Task): boolean => {
  return Boolean(task.isCompleted);
};

// Bot Avatar Component
const BotAvatar: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <View
    className="rounded-full items-center justify-center"
    style={{
      width: size,
      height: size,
      backgroundColor: "#8B5CF6",
    }}
  >
    <Ionicons name="chatbubble-ellipses" size={size * 0.5} color="#fff" />
  </View>
);

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  onQuickAction?: (action: QuickAction) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onQuickAction,
}) => {
  const isBot = message.type === "bot";

  return (
    <View
      className={`flex-row mb-4 ${isBot ? "justify-start" : "justify-end"}`}
    >
      {isBot && (
        <View className="mr-2 mt-1">
          <BotAvatar size={32} />
        </View>
      )}

      <View
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isBot
            ? "bg-gray-800 rounded-tl-sm"
            : "bg-purple-600 rounded-tr-sm"
        }`}
      >
        {/* Task Card (if applicable) */}
        {message.taskData && (
          <View className="bg-gray-900/50 rounded-xl p-3 mb-2 border border-gray-700">
            <View className="flex-row items-center">
              <Ionicons
                name="alert-circle"
                size={18}
                color="#F97316"
              />
              <Text className="text-orange-400 text-xs font-semibold ml-1">
                {message.taskData.daysOverdue
                  ? `${message.taskData.daysOverdue} days overdue`
                  : "Overdue"}
              </Text>
            </View>
            <Text className="text-white font-semibold mt-1">
              {message.taskData.taskTitle}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className="px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor:
                    message.taskData.priority === "High"
                      ? "rgba(244, 63, 94, 0.2)"
                      : message.taskData.priority === "Medium"
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(16, 185, 129, 0.2)",
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{
                    color:
                      message.taskData.priority === "High"
                        ? "#F43F5E"
                        : message.taskData.priority === "Medium"
                        ? "#F59E0B"
                        : "#10B981",
                  }}
                >
                  {message.taskData.priority}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Message Content */}
        <Text className={`text-sm ${isBot ? "text-gray-200" : "text-white"}`}>
          {message.content}
        </Text>

        {!isBot && message.classification && (
          <View className="mt-2">
            <View
              className={`self-start px-2 py-1 rounded-full ${
                PRODUCTIVITY_BADGE_MAP[message.classification.label].classes
              }`}
            >
              <Text className="text-[10px] font-semibold">
                {PRODUCTIVITY_BADGE_MAP[message.classification.label].text}
                {" • "}
                {(message.classification.confidence * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        )}

        {/* Timestamp */}
        <Text
          className={`text-xs mt-1 ${
            isBot ? "text-gray-500" : "text-purple-200"
          }`}
        >
          {message.timestamp.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </Text>

        {/* Quick Actions */}
        {message.quickActions && message.quickActions.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-3">
            {message.quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => onQuickAction?.(action)}
                className="bg-purple-600/30 border border-purple-500/50 px-3 py-2 rounded-full"
              >
                <Text className="text-purple-300 text-xs font-medium">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {!isBot && (
        <View className="ml-2 mt-1">
          <View
            className="rounded-full items-center justify-center bg-gray-700"
            style={{ width: 32, height: 32 }}
          >
            <Ionicons name="person" size={16} color="#9CA3AF" />
          </View>
        </View>
      )}
    </View>
  );
};

// Typing Indicator Component
const TypingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row mb-4 justify-start">
      <View className="mr-2 mt-1">
        <BotAvatar size={32} />
      </View>
      <View className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
        <View className="flex-row items-center h-5">
          {[dot1, dot2, dot3].map((dot, index) => (
            <Animated.View
              key={index}
              className="w-2 h-2 rounded-full bg-purple-400 mx-0.5"
              style={{
                transform: [
                  {
                    translateY: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// Main Chatbot Component
export default function Chatbot() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Generate initial bot messages after tasks load
  useEffect(() => {
    if (!loading && tasks.length > 0) {
      generateInitialMessages();
    } else if (!loading && tasks.length === 0) {
      // No tasks message
      setMessages([
        {
          id: "1",
          type: "bot",
          content:
            "Hi! I'm Taskora Assistant 👋 I'm here to help you stay on top of your tasks.",
          timestamp: new Date(),
        },
        {
          id: "2",
          type: "bot",
          content:
            "You don't have any tasks yet. Create some tasks and I'll help you manage them!",
          timestamp: new Date(),
          quickActions: [
            { id: "create", label: "➕ Create Task", action: "view_task" },
          ],
        },
      ]);
    }
  }, [loading, tasks]);

  const loadTasks = async () => {
    try {
      const result = await getAllTasks({ limit: 100, page: 1 });
      setTasks(result.tasks);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateInitialMessages = () => {
    const overdueTasks = tasks.filter(
      (task) => !isCompleted(task) && isOverdue(task.dueDate)
    );

    const initialMessages: ChatMessage[] = [
      {
        id: "welcome",
        type: "bot",
        content:
          "Hi! I'm Taskora Assistant 👋 I'm here to help you stay on top of your tasks.",
        timestamp: new Date(Date.now() - 5000),
      },
    ];

    if (overdueTasks.length > 0) {
      // Add overdue task notifications
      overdueTasks.slice(0, 3).forEach((task, index) => {
        const daysOverdue = getDaysOverdue(task.dueDate);
        initialMessages.push({
          id: `overdue-${task.id}`,
          type: "bot",
          content:
            daysOverdue > 1
              ? `⚠️ This task is ${daysOverdue} days overdue!`
              : "⚠️ This task was due yesterday!",
          timestamp: new Date(Date.now() - 4000 + index * 1000),
          taskData: {
            taskId: task.id,
            taskTitle: task.title,
            priority: task.priority?.name || "Medium",
            daysOverdue,
          },
          quickActions: [
            {
              id: `view-${task.id}`,
              label: "👁 View Task",
              action: "view_task",
              taskId: task.id,
            },
            {
              id: `complete-${task.id}`,
              label: "✅ Mark Complete",
              action: "mark_complete",
              taskId: task.id,
            },
          ],
        });
      });

      if (overdueTasks.length > 3) {
        initialMessages.push({
          id: "more-overdue",
          type: "bot",
          content: `You have ${overdueTasks.length - 3} more overdue tasks. Would you like to see them?`,
          timestamp: new Date(),
          quickActions: [
            {
              id: "view-tasks",
              label: "📋 View All Tasks",
              action: "view_task",
            },
          ],
        });
      }

      initialMessages.push({
        id: "missed-task-reason",
        type: "bot",
        content:
          "Can you share why these task(s) were missed? Your answer helps me understand your productivity pattern.",
        timestamp: new Date(Date.now() - 1000),
      });
    } else {
      initialMessages.push({
        id: "all-good",
        type: "bot",
        content:
          "Great news! 🎉 You don't have any overdue tasks. Keep up the good work!",
        timestamp: new Date(Date.now() - 3000),
      });
    }

    setMessages(initialMessages);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const trimmedMessage = inputText.trim();
    const userMessageId = Date.now().toString();

    const userMessage: ChatMessage = {
      id: userMessageId,
      type: "user",
      content: trimmedMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    setIsTyping(true);

    try {
      const response = await sendChatbotMessage({ message: trimmedMessage });

      if (response.classification) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === userMessageId
              ? { ...message, classification: response.classification }
              : message
          )
        );
      }

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: response.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (_error) {
      const botResponse = generateBotResponse(trimmedMessage);
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateBotResponse = (userInput: string): ChatMessage => {
    const input = userInput.toLowerCase();

    if (
      input.includes("overdue") ||
      input.includes("missed") ||
      input.includes("late")
    ) {
      const overdueTasks = tasks.filter(
        (task) => !isCompleted(task) && isOverdue(task.dueDate)
      );
      if (overdueTasks.length > 0) {
        const task = overdueTasks[0];
        return {
          id: Date.now().toString(),
          type: "bot",
          content: `You have ${overdueTasks.length} overdue task(s). Here's the most urgent one:`,
          timestamp: new Date(),
          taskData: {
            taskId: task.id,
            taskTitle: task.title,
            priority: task.priority?.name || "Medium",
            daysOverdue: getDaysOverdue(task.dueDate),
          },
          quickActions: [
            {
              id: `view-${task.id}`,
              label: "👁 View Task",
              action: "view_task",
              taskId: task.id,
            },
          ],
        };
      } else {
        return {
          id: Date.now().toString(),
          type: "bot",
          content: "You don't have any overdue tasks! 🎉",
          timestamp: new Date(),
        };
      }
    }

    if (input.includes("help")) {
      return {
        id: Date.now().toString(),
        type: "bot",
        content:
          "I can help you with:\n• Checking overdue tasks\n• Viewing task details\n• Task reminders\n\nJust ask me anything about your tasks!",
        timestamp: new Date(),
      };
    }

    if (input.includes("task") || input.includes("todo")) {
      return {
        id: Date.now().toString(),
        type: "bot",
        content: `You have ${tasks.length} total tasks. ${
          tasks.filter((t) => !isCompleted(t)).length
        } are still pending.`,
        timestamp: new Date(),
        quickActions: [
          {
            id: "view-tasks",
            label: "📋 View All Tasks",
            action: "view_task",
          },
        ],
      };
    }

    // Default response
    const responses = [
      "I'm here to help you manage your tasks! Try asking about overdue tasks or say 'help' for options.",
      "I can help you stay on track with your tasks. Ask me about overdue tasks or your task summary!",
      "Need help with your tasks? I can show you overdue items or give you a summary.",
    ];

    return {
      id: Date.now().toString(),
      type: "bot",
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
    };
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.action === "view_task" && action.taskId) {
      router.push(`/tasks?taskId=${action.taskId}`);
    } else if (action.action === "view_task") {
      router.push("/tasks");
    } else if (action.action === "mark_complete" && action.taskId) {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        content: `Mark task as complete`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Simulate bot response
      setIsTyping(true);
      setTimeout(() => {
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content:
            "Great! I've marked the task as complete. 🎉 Would you like to view your other tasks?",
          timestamp: new Date(),
          quickActions: [
            {
              id: "view-tasks",
              label: "📋 View All Tasks",
              action: "view_task",
            },
          ],
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsTyping(false);
      }, 1000);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-1 justify-center items-center">
          <BotAvatar size={64} />
          <Text className="text-white text-lg mt-4">Loading assistant...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-800 flex-row items-center">
        <BotAvatar size={40} />
        <View className="ml-3 flex-1">
          <Text className="text-white font-semibold text-lg">
            Taskora Assistant
          </Text>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
            <Text className="text-gray-400 text-xs">Online</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            setMessages([]);
            generateInitialMessages();
          }}
          className="p-2"
        >
          <Ionicons name="refresh" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Date Separator */}
          <View className="items-center mb-4">
            <View className="bg-gray-800 px-4 py-1 rounded-full">
              <Text className="text-gray-400 text-xs">Today</Text>
            </View>
          </View>

          {/* Messages */}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onQuickAction={handleQuickAction}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {/* Input Area */}
        <View className="px-4 py-3 border-t border-gray-800 bg-gray-900">
          <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center bg-gray-800 rounded-full px-4 py-2 border border-gray-700">
              <TextInput
                className="flex-1 text-white text-sm"
                placeholder="Type a message..."
                placeholderTextColor="#6B7280"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendMessage}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                inputText.trim() ? "bg-purple-600" : "bg-gray-700"
              }`}
            >
              <Ionicons
                name="send"
                size={18}
                color={inputText.trim() ? "#fff" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          {/* Quick Suggestions */}
          <View className="flex-row flex-wrap gap-2 mt-3">
            {["Show overdue", "Help", "Task summary"].map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                onPress={() => {
                  setInputText(suggestion);
                }}
                className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-full"
              >
                <Text className="text-gray-300 text-xs">{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
