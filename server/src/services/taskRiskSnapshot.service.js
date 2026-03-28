import { prisma } from "../config/db.js";
import { HIGH_RISK_THRESHOLD } from "../config/ml.constants.js";
import { getLocalDateKey, getSafeTimezone } from "../utils/timezone.utils.js";
import { taskRiskPredictionService } from "./taskRiskPrediction.service.js";

const normalizeTopFactors = (topFactors) => {
  if (!Array.isArray(topFactors)) {
    return [];
  }

  return topFactors.filter((item) => typeof item === "string");
};

export const taskRiskSnapshotService = {
  upsertSnapshot: async ({
    userId,
    taskId,
    timezone,
    source = "on_demand",
    force = false,
  }) => {
    const safeTimezone = getSafeTimezone(timezone);
    const predictedForDateKey = getLocalDateKey(new Date(), safeTimezone);

    if (!force) {
      const existing = await prisma.taskRiskSnapshot.findUnique({
        where: {
          userId_taskId_predictedForDateKey: {
            userId,
            taskId,
            predictedForDateKey,
          },
        },
      });

      if (existing) {
        return existing;
      }
    }

    const result = await taskRiskPredictionService.predictTaskRisk({ taskId, userId });
    const prediction = result.prediction || {};

    return prisma.taskRiskSnapshot.upsert({
      where: {
        userId_taskId_predictedForDateKey: {
          userId,
          taskId,
          predictedForDateKey,
        },
      },
      create: {
        userId,
        taskId,
        risk: String(prediction.risk || "LOW"),
        probability: Number(prediction.probability || 0),
        topFactors: normalizeTopFactors(prediction.top_factors),
        source,
        predictedForDateKey,
      },
      update: {
        risk: String(prediction.risk || "LOW"),
        probability: Number(prediction.probability || 0),
        topFactors: normalizeTopFactors(prediction.top_factors),
        source,
      },
    });
  },

  ensureSnapshotsForTasks: async ({
    userId,
    taskIds,
    timezone,
    source = "scheduled",
  }) => {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return { created: 0 };
    }

    let created = 0;
    for (const taskId of taskIds) {
      try {
        await taskRiskSnapshotService.upsertSnapshot({
          userId,
          taskId,
          timezone,
          source,
          force: false,
        });
        created += 1;
      } catch (_error) {
      }
    }

    return { created };
  },

  getHighRiskCountForDateKey: async ({ userId, taskIds, dateKey }) => {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return 0;
    }

    return prisma.taskRiskSnapshot.count({
      where: {
        userId,
        taskId: { in: taskIds },
        predictedForDateKey: dateKey,
        probability: { gte: HIGH_RISK_THRESHOLD },
      },
    });
  },
};
