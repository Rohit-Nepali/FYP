import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS } from "../utils/response.utils.js";

const ML_API_BASE_URL = (process.env.ML_API_URL || "http://localhost:8000").replace(/\/+$/, "");

const HIGH_RISK_LABELS = new Set([
  "LOW_ENERGY",
  "WORK_OVERLOAD",
  "DISTRACTION",
  "PROCRASTINATION",
  "POOR_PLANNING",
  "FORGETFULNESS",
]);

const computeBehaviorRiskScore = (signals) => {
  if (!signals || signals.length === 0) {
    return 0;
  }

  let weightedRisk = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    const confidence = Number(signal.confidence || 0);
    if (confidence <= 0) {
      continue;
    }

    const isHighRisk = HIGH_RISK_LABELS.has(signal.label);
    const riskContribution = isHighRisk ? 1 : 0;

    weightedRisk += riskContribution * confidence;
    totalWeight += confidence;
  }

  if (totalWeight <= 0) {
    return 0;
  }

  return Number((weightedRisk / totalWeight).toFixed(4));
};

const computeDueMetrics = (dueDate, isCompleted) => {
  if (!dueDate || isCompleted) {
    return {
      dueInDays: null,
      daysOverdue: 0,
    };
  }

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays >= 0) {
    return {
      dueInDays: Number(diffDays.toFixed(2)),
      daysOverdue: 0,
    };
  }

  return {
    dueInDays: Number(diffDays.toFixed(2)),
    daysOverdue: Number(Math.abs(diffDays).toFixed(2)),
  };
};

export const taskRiskPredictionService = {
  predictTaskRisk: async ({ taskId, userId }) => {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          {
            project: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
              ],
            },
          },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new ApiError("Task not found or access denied", HTTP_STATUS.NOT_FOUND);
    }

    const now = new Date();
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [recentActivityCount, behaviorSignals] = await Promise.all([
      prisma.activity.count({
        where: {
          taskId,
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.userBehaviorSignal.findMany({
        where: {
          userId,
          createdAt: {
            gte: fourteenDaysAgo,
          },
          OR: [
            { taskId: null },
            { taskId },
          ],
        },
        select: {
          label: true,
          confidence: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
      }),
    ]);

    const behaviorRiskScore = computeBehaviorRiskScore(behaviorSignals);
    const { dueInDays, daysOverdue } = computeDueMetrics(task.dueDate, task.isCompleted);

    const mlPayload = {
      task_id: task.id,
      is_completed: task.isCompleted,
      due_in_days: dueInDays,
      days_overdue: daysOverdue,
      recent_activity_count: recentActivityCount,
      behavior_risk_score: behaviorRiskScore,
    };

    const response = await fetch(`${ML_API_BASE_URL}/predict-task-risk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mlPayload),
    });

    if (!response.ok) {
      throw new ApiError("ML service unavailable for task risk prediction", HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    const prediction = await response.json();

    return {
      task: {
        id: task.id,
        title: task.title,
        isCompleted: task.isCompleted,
        dueDate: task.dueDate,
        project: task.project,
        assignee: task.assignee,
      },
      features: {
        dueInDays,
        daysOverdue,
        recentActivityCount,
        behaviorRiskScore,
      },
      prediction,
    };
  },
};
