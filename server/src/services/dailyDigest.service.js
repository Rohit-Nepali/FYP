import crypto from "crypto";
import { prisma } from "../config/db.js";
import { HIGH_RISK_THRESHOLD } from "../config/ml.constants.js";
import { createInAppNotification, sendPushNotification } from "./notification.service.js";
import { taskRiskSnapshotService } from "./taskRiskSnapshot.service.js";
import {
  getLocalDateKey,
  getSafeTimezone,
  shouldRunDigestNow,
} from "../utils/timezone.utils.js";

const formatDigestMessage = ({ missedTasks, highRiskTasks, shouldUseSupportiveTone }) => {
  if (shouldUseSupportiveTone) {
    return `You missed ${missedTasks} task(s) today. ${highRiskTasks} task(s) are at high risk for tomorrow. You can recover quickly by planning your top 1-2 tasks now.`;
  }

  return `You missed ${missedTasks} task(s) today. ${highRiskTasks} task(s) are at high risk for tomorrow.`;
};

const shouldUseSupportiveTone = (recentDigestNotifications) => {
  if (!recentDigestNotifications || recentDigestNotifications.length === 0) {
    return true;
  }

  const openedCount = recentDigestNotifications.filter((n) => Boolean(n.readAt)).length;
  const ignoredCount = recentDigestNotifications.filter((n) => Boolean(n.ignoredAt)).length;

  return openedCount >= ignoredCount;
};

export const dailyDigestService = {
  runForEligibleUsers: async () => {
    const now = new Date();

    const users = await prisma.user.findMany({
      where: {
        dailyDigestEnabled: true,
      },
      select: {
        id: true,
        pushToken: true,
        timezone: true,
        digestHourLocal: true,
      },
    });

    let sent = 0;
    let skipped = 0;

    for (const user of users) {
      const timezone = getSafeTimezone(user.timezone);
      const digestHourLocal = Number.isInteger(user.digestHourLocal) ? user.digestHourLocal : 19;

      if (!shouldRunDigestNow({ now, timeZone: timezone, digestHourLocal })) {
        skipped += 1;
        continue;
      }

      const digestDateKey = getLocalDateKey(now, timezone);

      const existingLog = await prisma.dailyDigestLog.findUnique({
        where: {
          userId_digestDateKey: {
            userId: user.id,
            digestDateKey,
          },
        },
      });

      if (existingLog) {
        skipped += 1;
        continue;
      }

      const missedTasks = await prisma.task.findMany({
        where: {
          creatorId: user.id,
          isCompleted: false,
          dueDate: {
            lt: now,
          },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
        },
        take: 100,
      });

      const tomorrowWindowEnd = new Date(now);
      tomorrowWindowEnd.setHours(tomorrowWindowEnd.getHours() + 36);

      const tomorrowTasks = await prisma.task.findMany({
        where: {
          creatorId: user.id,
          isCompleted: false,
          dueDate: {
            gte: now,
            lte: tomorrowWindowEnd,
          },
        },
        select: {
          id: true,
          dueDate: true,
        },
        take: 100,
      });

      const tomorrowTaskIds = tomorrowTasks.map((task) => task.id);

      await taskRiskSnapshotService.ensureSnapshotsForTasks({
        userId: user.id,
        taskIds: tomorrowTaskIds,
        timezone,
        source: "scheduled",
      });

      const highRiskTasks = await taskRiskSnapshotService.getHighRiskCountForDateKey({
        userId: user.id,
        taskIds: tomorrowTaskIds,
        dateKey: digestDateKey,
      });

      if (missedTasks.length <= 0 && highRiskTasks <= 0) {
        skipped += 1;
        continue;
      }

      const recentDigestNotifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
          type: "DAILY_TASK_DIGEST",
        },
        select: {
          readAt: true,
          ignoredAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 7,
      });

      const message = formatDigestMessage({
        missedTasks: missedTasks.length,
        highRiskTasks,
        shouldUseSupportiveTone: shouldUseSupportiveTone(recentDigestNotifications),
      });

      await createInAppNotification({
        userId: user.id,
        type: "DAILY_TASK_DIGEST",
        title: "Daily Task Risk Summary",
        message,
        data: {
          digestDateKey,
          missedTasks: missedTasks.length,
          highRiskTasks,
          highRiskThreshold: HIGH_RISK_THRESHOLD,
          topMissedTaskTitle: missedTasks[0]?.title || null,
          recommendation: "Open insights dashboard to review trends.",
        },
      });

      if (user.pushToken) {
        await sendPushNotification(user.pushToken, "Daily Task Risk Summary", message, {
          type: "DAILY_TASK_DIGEST",
        });
      }

      const payloadHash = crypto
        .createHash("sha256")
        .update(`${user.id}:${digestDateKey}:${missedTasks.length}:${highRiskTasks}`)
        .digest("hex");

      await prisma.dailyDigestLog.create({
        data: {
          userId: user.id,
          digestDateKey,
          timezone,
          deliveryChannel: user.pushToken ? "in_app_and_push" : "in_app",
          payloadHash,
        },
      });

      sent += 1;
    }

    return {
      processed: users.length,
      sent,
      skipped,
    };
  },
};
