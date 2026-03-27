import { makeRequest } from "./apiClient";

export interface CompletionTrendPoint {
  date: string;
  totalDue: number;
  completed: number;
  missed: number;
}

export interface RiskTrendPoint {
  date: string;
  avgProbability: number;
  highRiskCount: number;
}

export interface InsightItem {
  key: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  message: string;
}

export interface UserBehaviorInsightsResponse {
  summary: {
    completionRate: number;
    totalDue: number;
    totalCompleted: number;
    totalMissed: number;
    highRiskToday: number;
    dominantLabel: string | null;
    topMissedWeekday: string | null;
  };
  trends: {
    completion: CompletionTrendPoint[];
    risk: RiskTrendPoint[];
    labelsByDate: Record<string, Record<string, number>>;
    labelsTotal: Record<string, number>;
    missedByWeekday: Record<string, number>;
  };
  insights: InsightItem[];
  meta: {
    rangeDays: number;
    timezone: string;
    generatedAt: string;
    cache: "HIT" | "MISS";
  };
}

export async function getUserBehaviorInsights(rangeDays = 30): Promise<UserBehaviorInsightsResponse> {
  return makeRequest<UserBehaviorInsightsResponse>("/insights/user-behavior", {
    method: "GET",
    params: { rangeDays },
  });
}
