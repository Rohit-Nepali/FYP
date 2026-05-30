import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  getUserBehaviorInsights,
  UserBehaviorInsightsResponse,
} from "@/src/services/insightsService";

const RANGE_OPTIONS = [7, 30, 90];

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatTrendDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const toPercent = (value: number) => `${Math.round(value * 100)}%`;

const MiniBars = ({
  data,
  color,
  max,
}: {
  data: number[];
  color: string;
  max: number;
}) => {
  return (
    <View className="flex-row items-end h-20 gap-1">
      {data.map((value, index) => {
        const ratio = max > 0 ? value / max : 0;
        return (
          <View
            key={`${index}-${value}`}
            className="flex-1 rounded-t-md"
            style={{
              backgroundColor: color,
              height: Math.max(4, Math.round(ratio * 72)),
            }}
          />
        );
      })}
    </View>
  );
};

const CompletionTrendChart = ({
  points,
  max,
}: {
  points: Array<{ date: string; totalDue: number; completed: number }>;
  max: number;
}) => {
  return (
    <View>
      <View className="flex-row items-end gap-1 h-28 pb-2">
        {points.map((point) => {
          const dueHeight = Math.max(4, Math.round(((max > 0 ? point.totalDue / max : 0) * 88)));
          const completedHeight = Math.max(
            4,
            Math.round(((max > 0 ? point.completed / max : 0) * 88)
          ));

          return (
            <View key={point.date} className="flex-1 items-center justify-end gap-1 min-w-[18px]">
              <View className="w-full flex-row items-end justify-center gap-[2px] h-24">
                <View
                  className="flex-1 rounded-t-sm bg-slate-500/90"
                  style={{ height: dueHeight }}
                />
                <View
                  className="flex-1 rounded-t-sm bg-emerald-500"
                  style={{ height: completedHeight }}
                />
              </View>
              <Text className="text-gray-500 text-[10px] leading-3 text-center">
                {formatTrendDate(point.date)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const RiskTrendChart = ({
  points,
  max,
}: {
  points: Array<{ date: string; avgProbability: number }>;
  max: number;
}) => {
  return (
    <View>
      <View className="flex-row items-end gap-1 h-28 pb-2">
        {points.map((point) => {
          const barHeight = Math.max(4, Math.round(((max > 0 ? point.avgProbability / max : 0) * 88)));
          return (
            <View key={point.date} className="flex-1 items-center justify-end gap-1 min-w-[18px]">
              <View className="w-full h-24 flex justify-end">
                <View
                  className="w-full rounded-t-sm bg-orange-500"
                  style={{ height: barHeight }}
                />
              </View>
              <Text className="text-gray-500 text-[10px] leading-3 text-center">
                {formatTrendDate(point.date)}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="flex-row justify-between mt-1">
        <Text className="text-gray-500 text-xs">Low</Text>
        <Text className="text-gray-500 text-xs">High</Text>
      </View>
    </View>
  );
};

export default function InsightsScreen() {
  const router = useRouter();
  const [rangeDays, setRangeDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<UserBehaviorInsightsResponse | null>(null);

  const fetchData = async (nextRange = rangeDays, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await getUserBehaviorInsights(nextRange);
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData(rangeDays);
    }, [rangeDays])
  );

  const completionChart = useMemo(() => {
    const trend = insights?.trends.completion || [];
    const points = trend.slice(-14);
    const values = points.flatMap((row) => [row.totalDue, row.completed]);
    return { points, max: Math.max(1, ...values) };
  }, [insights]);

  const riskChart = useMemo(() => {
    const trend = insights?.trends.risk || [];
    const points = trend.slice(-14);
    const probs = points.map((row) => row.avgProbability);
    return { points, max: Math.max(0.01, ...probs) };
  }, [insights]);

  const labelRows = useMemo(() => {
    const labels = insights?.trends.labelsTotal || {};
    return Object.entries(labels)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [insights]);

  const missedWeekdayRows = useMemo(() => {
    const missed = insights?.trends.missedByWeekday || {};
    return Object.entries(missed).sort((a, b) => b[1] - a[1]);
  }, [insights]);

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="px-4 pt-2 pb-3 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            {/* <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={22} color="#E5E7EB" />
            </TouchableOpacity> */}
            <Text className="text-white text-xl font-bold">Behavior Insights</Text>
          </View>
          <TouchableOpacity
            onPress={() => fetchData(rangeDays, true)}
            className="bg-gray-800 rounded-full px-3 py-2"
          >
            <Ionicons name="refresh" size={16} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        <View className="flex-row mt-3 gap-2">
          {RANGE_OPTIONS.map((option) => {
            const active = rangeDays === option;
            return (
              <TouchableOpacity
                key={option}
                className={`px-3 py-2 rounded-full ${active ? "bg-cyan-600" : "bg-gray-800"}`}
                onPress={() => setRangeDays(option)}
              >
                <Text className={`${active ? "text-white" : "text-gray-300"} text-xs font-semibold`}>
                  {option}d
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(rangeDays, true)}
            tintColor="#06B6D4"
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      >
        {loading && !insights ? (
          <View className="bg-gray-800 rounded-2xl p-6">
            <Text className="text-gray-300">Loading insights...</Text>
          </View>
        ) : error ? (
          <View className="bg-red-900/30 border border-red-600/40 rounded-2xl p-4">
            <Text className="text-red-200 font-semibold">Could not load insights</Text>
            <Text className="text-red-300 text-sm mt-1">{error}</Text>
          </View>
        ) : !insights ? (
          <View className="bg-gray-800 rounded-2xl p-6">
            <Text className="text-gray-300">No insights available yet.</Text>
          </View>
        ) : (
          <>
            <View className="flex-row flex-wrap gap-3">
              <View className="bg-gray-800 rounded-xl p-4 w-[48%]">
                <Text className="text-gray-400 text-xs">Completion Rate</Text>
                <Text className="text-white text-2xl font-bold mt-1">
                  {insights.summary.completionRate.toFixed(1)}%
                </Text>
              </View>

              <View className="bg-gray-800 rounded-xl p-4 w-[48%]">
                <Text className="text-gray-400 text-xs">Missed Tasks</Text>
                <Text className="text-amber-300 text-2xl font-bold mt-1">
                  {insights.summary.totalMissed}
                </Text>
              </View>

              <View className="bg-gray-800 rounded-xl p-4 w-[48%]">
                <Text className="text-gray-400 text-xs">High Risk (latest)</Text>
                <Text className="text-rose-300 text-2xl font-bold mt-1">
                  {insights.summary.highRiskToday}
                </Text>
              </View>

              <View className="bg-gray-800 rounded-xl p-4 w-[48%]">
                <Text className="text-gray-400 text-xs">Top Blocker</Text>
                <Text className="text-cyan-300 text-sm font-semibold mt-2">
                  {insights.summary.dominantLabel || "No dominant signal"}
                </Text>
              </View>
            </View>

            <View className="bg-gray-800 rounded-xl p-4 mt-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 pr-3">
                  <Text className="text-white font-semibold">Task Completion Trend</Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    Gray = tasks due, green = tasks completed
                  </Text>
                </View>
                <View className="items-end gap-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-slate-500" />
                    <Text className="text-gray-300 text-[11px]">Due</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-emerald-500" />
                    <Text className="text-gray-300 text-[11px]">Completed</Text>
                  </View>
                </View>
              </View>

              <View className="mt-4">
                <CompletionTrendChart points={completionChart.points} max={completionChart.max} />
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-gray-500 text-xs">Older</Text>
                <Text className="text-gray-500 text-xs">Newer</Text>
              </View>
            </View>

            <View className="bg-gray-800 rounded-xl p-4 mt-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 pr-3">
                  <Text className="text-white font-semibold">Risk Probability Trend</Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    Average predicted risk over the last days
                  </Text>
                </View>
                <View className="items-end gap-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-orange-500" />
                    <Text className="text-gray-300 text-[11px]">Avg risk</Text>
                  </View>
                  {/* <Text className="text-gray-500 text-[10px]">0% to 100%</Text> */}
                </View>
              </View>

              <View className="mt-4">
                <RiskTrendChart points={riskChart.points} max={riskChart.max} />
              </View>
            </View>

            <View className="bg-gray-800 rounded-xl p-4 mt-4">
              <Text className="text-white font-semibold">Behavior Signals</Text>
              <Text className="text-gray-400 text-xs mt-1">Top classification labels</Text>
              <View className="mt-3 gap-2">
                {labelRows.length === 0 ? (
                  <Text className="text-gray-400 text-sm">No behavior signals recorded yet.</Text>
                ) : (
                  labelRows.map(([label, count]) => {
                    const max = labelRows[0][1] || 1;
                    const ratio = count / max;
                    return (
                      <View key={label}>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-gray-200 text-xs">{label}</Text>
                          <Text className="text-gray-400 text-xs">{count}</Text>
                        </View>
                        <View className="h-2 rounded-full bg-gray-700 overflow-hidden">
                          <View
                            className="h-2 rounded-full bg-cyan-500"
                            style={{ width: `${Math.max(6, Math.round(ratio * 100))}%` }}
                          />
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            <View className="bg-gray-800 rounded-xl p-4 mt-4">
              <Text className="text-white font-semibold">Missed Task Pattern</Text>
              <Text className="text-gray-400 text-xs mt-1">Missed tasks by weekday</Text>
              <View className="mt-3 gap-2">
                {missedWeekdayRows.map(([day, count]) => {
                  const max = missedWeekdayRows[0]?.[1] || 1;
                  const ratio = count / max;
                  return (
                    <View key={day}>
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-200 text-xs">{day}</Text>
                        <Text className="text-gray-400 text-xs">{count}</Text>
                      </View>
                      <View className="h-2 rounded-full bg-gray-700 overflow-hidden">
                        <View
                          className="h-2 rounded-full bg-amber-500"
                          style={{ width: `${Math.max(4, Math.round(ratio * 100))}%` }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View className="bg-cyan-900/20 border border-cyan-700/40 rounded-xl p-4 mt-4">
              <Text className="text-cyan-300 font-semibold">AI Feedback</Text>
              <View className="mt-2 gap-2">
                {insights.insights.map((item) => (
                  <View key={item.key} className="bg-gray-900/40 rounded-lg p-3">
                    <Text className="text-gray-100 text-sm">{item.message}</Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      Severity: {item.severity} • Confidence: {toPercent(item.confidence)}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className="text-gray-400 text-xs mt-3">
                Generated {formatDate(insights.meta.generatedAt)} • Cache: {insights.meta.cache}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
