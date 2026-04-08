/**
 * App-wide design tokens used across Taskora UI components.
 */
export const APP_THEME = {
  colors: {
    bg: "#111827",
    surface: "#374151",
    surfaceAlt: "#1F2937",
    border: "#4B5563",
    borderSubtle: "#374151",
    accent: "#3B82F6",
    accentBg: "#1E3A8A",
    accentBorder: "#2563EB",
    text: "#F3F4F6",
    textSub: "#9CA3AF",
    textMuted: "#6B7280",
    danger: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 20,
  },
} as const;

export type AppTheme = typeof APP_THEME;
