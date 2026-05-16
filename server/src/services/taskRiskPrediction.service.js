import { prisma } from "../config/db.js";
import { ApiError } from "../utils/error.utils.js";
import { HTTP_STATUS } from "../utils/response.utils.js";

const ML_API_BASE_URL = (process.env.ML_API_URL || "http://localhost:8000").replace(/\/+$/, "");

const computeDueInDays = (dueDate, isCompleted) => {
  if (!dueDate || isCompleted) {
    return null;
  }

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return Number(Math.max(diffDays, 0).toFixed(2));
};

const computeTaskFrequency = ({ totalActivityCount, taskCreatedAt }) => {
  if (!taskCreatedAt) {
    return 0;
  }

  const now = new Date();
  const createdAt = new Date(taskCreatedAt);
  const taskAgeDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const safeTaskAge = Math.max(taskAgeDays, 1);

  return Number((Number(totalActivityCount || 0) / safeTaskAge).toFixed(4));
};

const computeProjectHistoricalRiskRate = async ({ userId, projectId, taskId }) => {
  if (!projectId) {
    return null;
  }

  const projectTasks = await prisma.task.findMany({
    where: {
      projectId,
      id: {
        not: taskId,
      },
    },
    select: {
      id: true,
    },
    take: 200,
  });

  if (projectTasks.length === 0) {
    return null;
  }

  const snapshots = await prisma.taskRiskSnapshot.findMany({
    where: {
      userId,
      taskId: {
        in: projectTasks.map((task) => task.id),
      },
    },
    select: {
      taskId: true,
      probability: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 500,
  });

  if (snapshots.length === 0) {
    return null;
  }

  const latestByTaskId = new Map();
  for (const snapshot of snapshots) {
    if (!latestByTaskId.has(snapshot.taskId)) {
      latestByTaskId.set(snapshot.taskId, snapshot);
    }
  }

  const latestSnapshots = Array.from(latestByTaskId.values());
  if (latestSnapshots.length === 0) {
    return null;
  }

  const highRiskCount = latestSnapshots.filter(
    (snapshot) => Number(snapshot.probability || 0) >= 0.75
  ).length;

  return Number((highRiskCount / latestSnapshots.length).toFixed(4));
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
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [recentActivityCount, totalActivityCount, projectHistoricalRiskRate] = await Promise.all([
      prisma.activity.count({
        where: {
          taskId,
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.activity.count({
        where: {
          taskId,
        },
      }),
      computeProjectHistoricalRiskRate({
        userId,
        projectId: task.project?.id || null,
        taskId,
      }),
    ]);

    const dueInDays = computeDueInDays(task.dueDate, task.isCompleted);
    const taskFrequency = computeTaskFrequency({
      totalActivityCount,
      taskCreatedAt: task.createdAt,
    });

    const mlPayload = {
      task_id: task.id,
      due_in_days: dueInDays,
      recent_activity_count: recentActivityCount,
      task_frequency: taskFrequency,
      project_historical_risk_rate: projectHistoricalRiskRate,
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
        recentActivityCount,
        taskFrequency,
        projectHistoricalRiskRate,
      },
      prediction,
    };
  },
};
