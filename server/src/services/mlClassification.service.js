const ML_API_BASE_URL = (process.env.ML_API_URL || "http://localhost:8000").replace(/\/+$/, "");

const VALID_LABELS = new Set([
  "HIGH_MOTIVATION",
  "CONSISTENT_PRODUCTIVITY",
  "LOW_ENERGY",
  "WORK_OVERLOAD",
  "DISTRACTION",
  "PROCRASTINATION",
  "POOR_PLANNING",
  "FORGETFULNESS",
]);

export const classifyMessage = async (message) => {
  try {
    if (!message || typeof message !== "string" || !message.trim()) {
      return null;
    }

    const response = await fetch(`${ML_API_BASE_URL}/classify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const label = payload?.label;
    const confidence = Number(payload?.confidence);

    if (!VALID_LABELS.has(label) || Number.isNaN(confidence)) {
      return null;
    }

    return {
      label,
      confidence,
    };
  } catch (_error) {
    return null;
  }
};
