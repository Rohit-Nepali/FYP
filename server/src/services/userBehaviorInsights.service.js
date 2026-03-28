import { prisma } from "../config/db.js";
import {
  INSIGHTS_DEFAULT_RANGE_DAYS,
  INSIGHTS_MAX_RANGE_DAYS,
  HIGH_RISK_THRESHOLD,
} from "../config/ml.constants.js";
import { insightsCacheService } from "./insightsCache.service.js";
import { getSafeTimezone } from "../utils/timezone.utils.js";

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const PROCRASTINATION_LABEL = "PROCRASTINATION";

const toDateKey = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildDateSeries = (startDate, endDate) => {
  const series = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    series.push(toDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return series;
};

const getWeekdayName = (date, timezone) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
  }).format(date);

const generateInsights = ({
  weekdayMissedCounts,
  labelCounts,
  completionRate,
  riskTrend,
}) => {
  const insights = [];

  const mondayMissed = weekdayMissedCounts.Monday || 0;
  const totalMissed = Object.values(weekdayMissedCounts).reduce((sum, value) => sum + value, 0);
  if (totalMissed > 0 && mondayMissed / totalMissed >= 0.35) {
    insights.push({
      key: "monday_missed_pattern",
      severity: "medium",
      confidence: 0.78,
      message:
        "You miss tasks most often on Mondays. Consider planning lighter starts and setting one priority task for early Monday.",
    });
  }

  const totalLabels = Object.values(labelCounts).reduce((sum, value) => sum + value, 0);
  const procrastinationCount = labelCounts[PROCRASTINATION_LABEL] || 0;
  if (totalLabels > 0 && procrastinationCount / totalLabels >= 0.25) {
    insights.push({
      key: "high_procrastination_frequency",
      severity: "high",
      confidence: 0.84,
      message:
        "Procrastination signals are frequent in your recent chats. Try breaking tasks into 15-minute starter actions to reduce delay.",
    });
  }

  if (completionRate >= 75) {
    insights.push({
      key: "strong_completion_rate",
      severity: "low",
      confidence: 0.8,
      message:
        "Your completion rate is strong. Keep using the same planning rhythm and protect your current focus blocks.",
    });
  } else if (completionRate <= 45) {
    insights.push({
      key: "low_completion_rate",
      severity: "high",
      confidence: 0.76,
      message:
        "Your completion rate is currently low. Focus on fewer tasks per day and prioritize high-impact items first.",
    });
  }

  if (riskTrend.length >= 6) {
    const half = Math.floor(riskTrend.length / 2);
    const firstHalf = riskTrend.slice(0, half);
    const secondHalf = riskTrend.slice(half);

    const avg = (list) => {
      if (list.length === 0) {
        return 0;
      }
      return list.reduce((sum, item) => sum + item.avgProbability, 0) / list.length;
    };

    const firstAvg = avg(firstHalf);
    const secondAvg = avg(secondHalf);

    if (secondAvg - firstAvg >= 0.08) {
      insights.push({
        key: "rising_risk_trend",
        severity: "high",
        confidence: 0.74,
        message:
          "Task risk is trending up recently. Try moving difficult tasks earlier in the day and checking progress midday.",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      key: "stable_pattern",
      severity: "low",
      confidence: 0.65,
      message:
        "Your recent behavior pattern is stable. Continue tracking missed tasks and keep your daily priorities visible.",
    });
  }

  return insights.slice(0, 5);
};

export const userBehaviorInsightsService = {
  resolveRangeDays: (inputRangeDays) => {
    const parsed = Number.parseInt(String(inputRangeDays || INSIGHTS_DEFAULT_RANGE_DAYS), 10);

    if (Number.isNaN(parsed) || parsed <= 0) {
      return INSIGHTS_DEFAULT_RANGE_DAYS;
    }

    return Math.min(parsed, INSIGHTS_MAX_RANGE_DAYS);
  },

  getUserBehaviorInsights: async ({ userId, rangeDays, timezone }) => {
    const resolvedRange = userBehaviorInsightsService.resolveRangeDays(rangeDays);
    const safeTimezone = getSafeTimezone(timezone);

    const cached = insightsCacheService.get({
      userId,
      rangeDays: resolvedRange,
      timezone: safeTimezone,
    });

    if (cached) {
      return {
        ...cached,
        meta: {
          ...cached.meta,
          cache: "HIT",
        },
      };
    }

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setUTCDate(now.getUTCDate() - resolvedRange + 1);

    const [tasks, behaviorSignals, riskSnapshots] = await Promise.all([
      prisma.task.findMany({
        where: {
          creatorId: userId,
          createdAt: {
            gte: fromDate,
          },
        },
        select: {
          id: true,
          createdAt: true,
          dueDate: true,
          isCompleted: true,
        },
      }),
      prisma.userBehaviorSignal.findMany({
        where: {
          userId,
          createdAt: {
            gte: fromDate,
          },
        },
        select: {
          label: true,
          confidence: true,
          createdAt: true,
        },
      }),
      prisma.taskRiskSnapshot.findMany({
        where: {
          userId,
          createdAt: {
            gte: fromDate,
          },
        },
        select: {
          probability: true,
          predictedForDateKey: true,
          createdAt: true,
        },
      }),
    ]);

    const dateSeries = buildDateSeries(fromDate, now);

    const completionMap = Object.fromEntries(
      dateSeries.map((key) => [key, { date: key, totalDue: 0, completed: 0, missed: 0 }])
    );

    const weekdayMissedCounts = Object.fromEntries(WEEKDAY_ORDER.map((d) => [d, 0]));

    for (const task of tasks) {
      if (!task.dueDate) {
        continue;
      }

      const dueKey = toDateKey(task.dueDate);
      if (!completionMap[dueKey]) {
        continue;
      }

      completionMap[dueKey].totalDue += 1;
      if (task.isCompleted) {
        completionMap[dueKey].completed += 1;
      } else if (task.dueDate < now) {
        completionMap[dueKey].missed += 1;
        const weekday = getWeekdayName(task.dueDate, safeTimezone);
        if (weekdayMissedCounts[weekday] !== undefined) {
          weekdayMissedCounts[weekday] += 1;
        }
      }
    }

    const labelCounts = {};
    const labelTrendByDate = Object.fromEntries(dateSeries.map((key) => [key, {}]));

    for (const signal of behaviorSignals) {
      labelCounts[signal.label] = (labelCounts[signal.label] || 0) + 1;
      const key = toDateKey(signal.createdAt);
      if (!labelTrendByDate[key]) {
        continue;
      }
      labelTrendByDate[key][signal.label] = (labelTrendByDate[key][signal.label] || 0) + 1;
    }

    const riskMap = Object.fromEntries(
      dateSeries.map((key) => [key, { date: key, avgProbability: 0, highRiskCount: 0, count: 0 }])
    );

    for (const snapshot of riskSnapshots) {
      const key = snapshot.predictedForDateKey || toDateKey(snapshot.createdAt);
      if (!riskMap[key]) {
        continue;
      }

      riskMap[key].count += 1;
      riskMap[key].avgProbability += Number(snapshot.probability || 0);
      if (Number(snapshot.probability || 0) >= HIGH_RISK_THRESHOLD) {
        riskMap[key].highRiskCount += 1;
      }
    }

    const riskTrend = Object.values(riskMap).map((entry) => ({
      date: entry.date,
      avgProbability: entry.count > 0 ? Number((entry.avgProbability / entry.count).toFixed(4)) : 0,
      highRiskCount: entry.highRiskCount,
    }));

    const completionTrend = Object.values(completionMap);

    const totalDue = completionTrend.reduce((sum, row) => sum + row.totalDue, 0);
    const totalCompleted = completionTrend.reduce((sum, row) => sum + row.completed, 0);
    const totalMissed = completionTrend.reduce((sum, row) => sum + row.missed, 0);

    const completionRate = totalDue > 0 ? Number(((totalCompleted / totalDue) * 100).toFixed(2)) : 0;

    const dominantLabel = Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topMissedWeekday = Object.entries(weekdayMissedCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const result = {
      summary: {
        completionRate,
        totalDue,
        totalCompleted,
        totalMissed,
        highRiskToday: riskTrend[riskTrend.length - 1]?.highRiskCount || 0,
        dominantLabel,
        topMissedWeekday,
      },
      trends: {
        completion: completionTrend,
        risk: riskTrend,
        labelsByDate: labelTrendByDate,
        labelsTotal: labelCounts,
        missedByWeekday: weekdayMissedCounts,
      },
      insights: generateInsights({
        weekdayMissedCounts,
        labelCounts,
        completionRate,
        riskTrend,
      }),
      meta: {
        rangeDays: resolvedRange,
        timezone: safeTimezone,
        generatedAt: new Date().toISOString(),
        cache: "MISS",
      },
    };

    insightsCacheService.set({
      userId,
      rangeDays: resolvedRange,
      timezone: safeTimezone,
      data: result,
    });

    return result;
  },
};
