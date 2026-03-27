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
    const totals = trend.slice(-14).map((row) => row.totalDue);
    const completed = trend.slice(-14).map((row) => row.completed);
    return { totals, completed, max: Math.max(1, ...totals) };
  }, [insights]);

  const riskChart = useMemo(() => {
    const trend = insights?.trends.risk || [];
    const probs = trend.slice(-14).map((row) => row.avgProbability);
    return { probs, max: Math.max(0.01, ...probs) };
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
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={22} color="#E5E7EB" />
            </TouchableOpacity>
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
              <Text className="text-white font-semibold">Task Completion Trend</Text>
              <Text className="text-gray-400 text-xs mt-1">Last 14 days due vs completed</Text>
              <View className="mt-4">
                <MiniBars data={completionChart.totals} color="#334155" max={completionChart.max} />
                <View className="mt-1" />
                <MiniBars data={completionChart.completed} color="#10B981" max={completionChart.max} />
              </View>
            </View>

            <View className="bg-gray-800 rounded-xl p-4 mt-4">
              <Text className="text-white font-semibold">Risk Probability Trend</Text>
              <Text className="text-gray-400 text-xs mt-1">Average predicted risk (last 14 days)</Text>
              <View className="mt-4">
                <MiniBars data={riskChart.probs} color="#F97316" max={riskChart.max} />
                <View className="flex-row justify-between mt-2">
                  <Text className="text-gray-500 text-xs">0%</Text>
                  <Text className="text-gray-500 text-xs">100%</Text>
                </View>
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
