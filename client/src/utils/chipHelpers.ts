import { COLORS } from "@/src/utils/colors";

/**
 * Resolve semantic dot color by status/priority label.
 */
export function chipDotColor(name: string): string {
  const normalizedName = name.toLowerCase();

  if (
    normalizedName.includes("high") ||
    normalizedName.includes("urgent") ||
    normalizedName.includes("critical")
  ) {
    return COLORS.danger;
  }

  if (
    normalizedName.includes("medium") ||
    normalizedName.includes("mild") ||
    normalizedName.includes("progress")
  ) {
    return COLORS.warning;
  }

  if (
    normalizedName.includes("low") ||
    normalizedName.includes("done") ||
    normalizedName.includes("complete")
  ) {
    return COLORS.success;
  }

  return COLORS.accent;
}
