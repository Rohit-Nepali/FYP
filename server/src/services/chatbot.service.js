import { prisma } from "../config/db.js";
import { classifyMessage } from "./mlClassification.service.js";

const LOW_CONFIDENCE_THRESHOLD = Number.parseFloat(
  process.env.ML_LOW_CONFIDENCE_THRESHOLD || "0.6"
);

const userTaskAccessWhere = (userId) => ({
  OR: [
    { creatorId: userId },
    { assigneeId: userId },
    { project: { ownerId: userId } },
    { project: { members: { some: { userId } } } },
  ],
});

const normalizeMessage = (message) => (message || "").trim().toLowerCase();

const detectIntent = (message) => {
  const normalized = normalizeMessage(message);

  const overdueCommandPattern =
    /\b(show|list|view|check|get)\b.*\b(overdue|missed)\b|\b(overdue|missed)\b.*\b(tasks?)\b/;
  const summaryCommandPattern =
    /\b(task summary|summary|how many tasks|task count)\b/;
  const helpCommandPattern = /\b(help|what can you do|options)\b/;

  if (overdueCommandPattern.test(normalized)) {
    return "COMMAND_OVERDUE";
  }

  if (summaryCommandPattern.test(normalized)) {
    return "COMMAND_SUMMARY";
  }

  if (helpCommandPattern.test(normalized)) {
    return "COMMAND_HELP";
  }

  return "STATEMENT";
};

const formatDaysOverdue = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = now.getTime() - due.getTime();
  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return days;
};

const buildCommandReply = async ({ userId, intent }) => {
  if (intent === "COMMAND_HELP") {
    return "I can show overdue tasks, provide a task summary, and help understand why tasks were missed.";
  }

  if (intent === "COMMAND_SUMMARY") {
    const [totalTasks, pendingTasks, overdueTasks] = await Promise.all([
      prisma.task.count({ where: userTaskAccessWhere(userId) }),
      prisma.task.count({
        where: {
          ...userTaskAccessWhere(userId),
          isCompleted: false,
        },
      }),
      prisma.task.count({
        where: {
          ...userTaskAccessWhere(userId),
          isCompleted: false,
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return `You currently have ${totalTasks} task(s), ${pendingTasks} pending, and ${overdueTasks} overdue.`;
  }

  if (intent === "COMMAND_OVERDUE") {
    const overdueTasks = await prisma.task.findMany({
      where: {
        ...userTaskAccessWhere(userId),
        isCompleted: false,
        dueDate: { lt: new Date() },
      },
      orderBy: [{ dueDate: "asc" }],
      take: 3,
      select: {
        title: true,
        dueDate: true,
      },
    });

    if (overdueTasks.length === 0) {
      return "Great news — you have no overdue tasks right now.";
    }

    const mostUrgent = overdueTasks[0];
    const daysOverdue = formatDaysOverdue(mostUrgent.dueDate);

    return `You have ${overdueTasks.length} overdue task(s). Most urgent: "${mostUrgent.title}" (${daysOverdue} day(s) overdue).`;
  }

  return null;
};

const buildBotReply = (classification) => {
  if (!classification) {
    return "I couldn't classify that response right now. Could you share a bit more about why the task was missed?";
  }

  if (classification.confidence < LOW_CONFIDENCE_THRESHOLD) {
    return "I'm not fully sure yet. Could you explain the main reason the task was missed so I can understand better?";
  }

  const labelResponses = {
    HIGH_MOTIVATION:
      "Thanks for sharing. It sounds like motivation is improving—let’s keep that momentum going.",
    CONSISTENT_PRODUCTIVITY:
      "You seem to be staying consistent. Let's keep reinforcing this pattern.",
    LOW_ENERGY:
      "It sounds like energy levels might be affecting completion. We can adjust workload and timing.",
    WORK_OVERLOAD:
      "This seems related to overload. We should break tasks into smaller chunks and rebalance priorities.",
    DISTRACTION:
      "Distractions may be the blocker here. Let's identify the biggest interruption and reduce it.",
    PROCRASTINATION:
      "This sounds like procrastination pressure. Starting with a tiny first step can help.",
    POOR_PLANNING:
      "Planning seems to be a key issue. We can improve by defining clearer next actions and deadlines.",
    FORGETFULNESS:
      "Looks like reminders and routine might help here. We can set better cues for follow-through.",
  };

  return (
    labelResponses[classification.label] ||
    "Thanks for explaining. I've saved the productivity signals to improve future support."
  );
};

export const chatbotService = {
  handleMessage: async ({ userId, taskId, message }) => {
    const intent = detectIntent(message);

    if (intent !== "STATEMENT") {
      const commandReply = await buildCommandReply({ userId, intent });
      return {
        reply:
          commandReply ||
          "I can help with task commands or understand why tasks were missed.",
        intent,
        classification: null,
      };
    }

    const classification = await classifyMessage(message);

    if (classification && classification.confidence >= LOW_CONFIDENCE_THRESHOLD) {
      try {
        await prisma.userBehaviorSignal.create({
          data: {
            userId,
            taskId: taskId || null,
            label: classification.label,
            confidence: classification.confidence,
          },
        });
      } catch (_error) {
        // Log error but don't fail the whole response if signal saving fails
        console.error("Failed to save user behavior signal:", _error);
      }
    }

    return {
      reply: buildBotReply(classification),
      intent,
      classification,
    };
  },
};
