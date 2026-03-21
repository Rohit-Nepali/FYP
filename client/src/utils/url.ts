import { config } from "@/src/config/environment";

const apiOrigin = config.API_BASE_URL.replace(/\/api\/?$/, "");

export function resolveFileUrl(url?: string | null): string | undefined {
  if (!url) return undefined;

  const normalized = url.trim();
  if (!normalized) return undefined;

  if (/^(https?:|data:|file:|content:|blob:)/i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("//")) {
    return `https:${normalized}`;
  }

  if (normalized.startsWith("/")) {
    return `${apiOrigin}${normalized}`;
  }

  return `${apiOrigin}/${normalized.replace(/^\/+/, "")}`;
}
