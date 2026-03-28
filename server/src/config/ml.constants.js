export const HIGH_RISK_THRESHOLD = Number.parseFloat(
  process.env.HIGH_RISK_THRESHOLD || "0.7"
);

export const INSIGHTS_DEFAULT_RANGE_DAYS = Number.parseInt(
  process.env.INSIGHTS_DEFAULT_RANGE_DAYS || "30",
  10
);

export const INSIGHTS_MAX_RANGE_DAYS = Number.parseInt(
  process.env.INSIGHTS_MAX_RANGE_DAYS || "90",
  10
);

export const INSIGHTS_CACHE_TTL_MS = Number.parseInt(
  process.env.INSIGHTS_CACHE_TTL_MS || "300000",
  10
);
