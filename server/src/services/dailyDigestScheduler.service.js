import cron from "node-cron";
import logger from "../config/logger.js";
import { dailyDigestService } from "./dailyDigest.service.js";

let digestJob = null;

export const startDailyDigestScheduler = () => {
  const enabled = String(process.env.DAILY_DIGEST_ENABLED || "true") === "true";
  if (!enabled) {
    logger.info("[DailyDigestScheduler] Disabled by DAILY_DIGEST_ENABLED flag");
    return;
  }

  if (digestJob) {
    return;
  }

  // Run every hour, timezone-aware filtering happens inside the service.
  digestJob = cron.schedule("0 * * * *", async () => {
    try {
      const result = await dailyDigestService.runForEligibleUsers();
      logger.info("[DailyDigestScheduler] Digest run complete", result);
    } catch (error) {
      logger.error("[DailyDigestScheduler] Digest run failed", error);
    }
  });

  logger.info("[DailyDigestScheduler] Started (hourly cron)");
};
