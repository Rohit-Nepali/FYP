import { INSIGHTS_CACHE_TTL_MS } from "../config/ml.constants.js";

const cache = new Map();

const buildKey = ({ userId, rangeDays, timezone }) => `${userId}:${rangeDays}:${timezone}`;

export const insightsCacheService = {
  get: ({ userId, rangeDays, timezone }) => {
    const key = buildKey({ userId, rangeDays, timezone });
    const entry = cache.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  },

  set: ({ userId, rangeDays, timezone, data }) => {
    const key = buildKey({ userId, rangeDays, timezone });
    cache.set(key, {
      data,
      expiresAt: Date.now() + INSIGHTS_CACHE_TTL_MS,
    });
  },

  clearUser: (userId) => {
    for (const key of cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        cache.delete(key);
      }
    }
  },
};
