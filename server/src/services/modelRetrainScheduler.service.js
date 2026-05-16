import cron from "node-cron";
import logger from "../config/logger.js";

const ML_API_BASE_URL = (process.env.ML_API_URL || "http://localhost:8000").replace(/\/+$/, "");

let retrainJob = null;

export const startModelRetrainScheduler = () => {
  const enabled = String(process.env.MODEL_RETRAIN_ENABLED || "true") === "true";
  if (!enabled) {
    logger.info("[ModelRetrainScheduler] Disabled by MODEL_RETRAIN_ENABLED flag");
    return;
  }

  if (retrainJob) {
    return;
  }

  // Run daily at 02:00 server time
  retrainJob = cron.schedule("0 2 * * *", async () => {
    logger.info("[ModelRetrainScheduler] Starting nightly retrain request to ML service");
    try {
      const response = await fetch(`${ML_API_BASE_URL}/retrain-risk-model`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        logger.error("[ModelRetrainScheduler] Retrain failed", { status: response.status, body: text });
        return;
      }

      const json = await response.json();
      logger.info("[ModelRetrainScheduler] Retrain completed", json);
    } catch (error) {
      logger.error("[ModelRetrainScheduler] Retrain request error", error);
    }
  });

  logger.info("[ModelRetrainScheduler] Started (daily at 02:00)");
};

export const stopModelRetrainScheduler = () => {
  if (retrainJob) {
    retrainJob.stop();
    retrainJob = null;
  }
};
