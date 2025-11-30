/**
 * Centralized theme configuration
 * Based on the login screen color scheme for consistency across all screens
 */

export const theme = {
  // Background colors
  background: {
    primary: "#0B0F14", // Dark blue-black
    secondary: "#111827", // Slightly lighter dark blue
    gradient: ["#0B0F14", "#111827"], // Linear gradient colors
  },
  text: {
    primary: "#FFFFFF", // White
    secondary: "#E5E7EB", // gray-200
    tertiary: "#9CA3AF", // gray-400
    muted: "#6B7280", // gray-500 (for placeholders)
    link: "#93C5FD", // blue-300
    linkHover: "#60A5FA", // blue-400
  },
  input: {
    background: "#1F2937", // gray-800
    border: "#374151", // gray-700
    placeholder: "#6B7280", // gray-500
    icon: "#9CA3AF", // gray-400
    text: "#E5E7EB", // gray-200
  },
  button: {
    primary: {
      background: "#2563EB", // blue-600
      text: "#FFFFFF", // white
      disabled: "#1E40AF", // blue-800 (darker when disabled)
    },
    secondary: {
      background: "#1F2937", // gray-800
      text: "#E5E7EB", // gray-200
      border: "#374151", // gray-700
    },
    google: {
      background: "rgba(255, 255, 255, 0.9)",
      text: "#1F2937", // gray-800
      icon: "#DB4437", // Google red
    },
  },
  border: {
    primary: "rgba(255, 255, 255, 0.1)", // white/10
    secondary: "rgba(255, 255, 255, 0.05)", // white/5
    divider: "rgba(255, 255, 255, 0.1)", // white/10
    input: "#374151", // gray-700
  },
  icon: {
    primary: "#9CA3AF", // gray-400
    secondary: "#6B7280", // gray-500
    accent: "#93C5FD", // blue-300
  },
  card: {
    background: "rgba(255, 255, 255, 0.05)", // white/5
    border: "rgba(255, 255, 255, 0.1)", // white/10
  },
  divider: {
    line: "rgba(255, 255, 255, 0.1)", // white/10
    text: "#9CA3AF", // gray-400
  },
  status: {
    success: "#10B981", // green-500
    error: "#EF4444", // red-500
    warning: "#F59E0B", // yellow-500
    info: "#3B82F6", // blue-500
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      "2xl": 24,
      "3xl": 30,
      "4xl": 36,
    },
    weights: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
} as const;

// Type export for TypeScript
export type Theme = typeof theme;
