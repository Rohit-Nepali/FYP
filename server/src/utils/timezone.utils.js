const localPartsFormatterCache = new Map();

const getFormatter = (timeZone) => {
  const key = timeZone || "UTC";
  if (!localPartsFormatterCache.has(key)) {
    localPartsFormatterCache.set(
      key,
      new Intl.DateTimeFormat("en-CA", {
        timeZone: key,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  }

  return localPartsFormatterCache.get(key);
};

export const getSafeTimezone = (value) => {
  const candidate = value || "UTC";
  try {
    Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch (_error) {
    return "UTC";
  }
};

export const getLocalDateTimeParts = (date, timeZone) => {
  const formatter = getFormatter(getSafeTimezone(timeZone));
  const parts = formatter.formatToParts(date);

  const byType = Object.create(null);
  for (const part of parts) {
    byType[part.type] = part.value;
  }

  return {
    year: Number.parseInt(byType.year, 10),
    month: Number.parseInt(byType.month, 10),
    day: Number.parseInt(byType.day, 10),
    hour: Number.parseInt(byType.hour, 10),
    minute: Number.parseInt(byType.minute, 10),
    weekday: byType.weekday,
  };
};

export const getLocalDateKey = (date, timeZone) => {
  const { year, month, day } = getLocalDateTimeParts(date, timeZone);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
};

export const getTomorrowDateKey = (date, timeZone) => {
  const base = getLocalDateTimeParts(date, timeZone);
  const utcReference = new Date(Date.UTC(base.year, base.month - 1, base.day));
  utcReference.setUTCDate(utcReference.getUTCDate() + 1);

  const year = utcReference.getUTCFullYear();
  const month = String(utcReference.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utcReference.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const shouldRunDigestNow = ({ now, timeZone, digestHourLocal = 19 }) => {
  const localNow = getLocalDateTimeParts(now, timeZone);
  return localNow.hour >= digestHourLocal && localNow.hour < digestHourLocal + 1;
};
