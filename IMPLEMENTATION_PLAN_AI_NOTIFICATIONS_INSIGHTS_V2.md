# Taskora AI Features Implementation Plan (Refined v2)

## 1. Scope and Principles

- Keep existing chatbot classification flow untouched.
- Reuse current services and Prisma patterns.
- Persist enough inference output for trends and notification efficiency.
- Ship in phases with feature flags for scheduler and insight feedback text.

## 2. Data Model Additions

- Add `TaskRiskSnapshot` for persisted risk inference history:
  - `userId`, `taskId`, `risk`, `probability`, `topFactors` (JSON), `source` (`on_demand` | `scheduled`), `predictedForDate`, `createdAt`.
- Add `DailyDigestLog` for idempotency:
  - `userId`, `digestDateLocal`, `timezone`, `sentAt`, `deliveryChannel`, `payloadHash`.
- Add user digest preference fields:
  - `timezone` (IANA), `dailyDigestEnabled`, `digestHourLocal` (default 19).
- Add notification engagement tracking:
  - `openedAt`, `ignoredAt` (or status enum) to support smarter future tone.

## 3. Timezone-Aware Scheduling

- Run backend cron hourly (not globally once per day).
- Select users whose local time falls in 7:00 PM to 7:59 PM window using stored timezone.
- Skip users already processed for that local date via `DailyDigestLog`.
- Keep execution idempotent and horizontally safe with uniqueness constraints.

## 4. Centralized Risk Threshold

- Introduce one config constant: `HIGH_RISK_THRESHOLD = 0.7`.
- Use this in scheduler, insights aggregation, and high-risk counters.
- Remove magic numbers and support env override.

## 5. Hybrid Risk Snapshot Strategy

- On-demand snapshot updates when task changes materially.
- Scheduled daily backfill for active tasks lacking a fresh snapshot.
- Reuse existing feature engineering and ML inference endpoint.
- Deduplicate using `(userId, taskId, predictedForDate)`.

## 6. Daily Missed Task Notification System

- Query missed tasks by user local date cutoff and completion state.
- Compute high-risk task count from latest snapshots.
- Call ML only for missing/stale snapshots.
- Send digest only if `missedTasks > 0 OR highRiskTasks > 0`.
- Persist in-app notifications and optionally send push notifications.
- Track engagement to adapt future tone.

## 7. Smart Notification Tone Logic

- If recent digests are ignored: concise tone + clear CTA.
- If recent digests are opened: supportive tone + trend context.
- Keep templates deterministic and safe.

## 8. Insight Generation Layer (Important)

- Add a rule engine that converts raw stats to human-readable insights.
- Example rules:
  - If missed tasks peak on Monday, generate weekday-pattern insight.
  - If procrastination labels are frequent, generate behavior insight.
  - If risk trend rises, generate preventive planning insight.
  - If completion improves, generate reinforcement insight.
- Return top ranked insights with severity and confidence score.

## 9. Backend API for Insights

- Create `GET /api/insights/user-behavior`.
- Constraints:
  - Default range: 30 days.
  - Max range: 90 days.
- Aggregate and return:
  - classification label trends,
  - completion rate,
  - missed-task patterns,
  - risk trends.
- Add response caching with TTL 5-10 minutes.

## 10. Frontend Behavior Insights Dashboard

- Add a dedicated mobile screen.
- Display:
  - summary cards,
  - line/bar visual trend sections,
  - generated feedback panel.
- Include loading, empty, error, and refresh states.

## 11. Scalability and Reliability

- Batch processing and avoid N+1 queries.
- Add indexes for `userId`, `createdAt`, `predictedForDate`, `taskId`.
- Add scheduler metrics/logs:
  - users processed,
  - notifications sent,
  - skipped users,
  - failed deliveries,
  - avoided ML calls.
- Handle ML downtime gracefully.

## 12. Testing and Rollout

- Unit tests for threshold logic, timezone windowing, digest eligibility, and insight rules.
- Integration tests for insights endpoint constraints and response shape.
- Scheduler idempotency tests.
- Rollout order:
  1. migrations,
  2. backend services,
  3. scheduler behind flag,
  4. frontend dashboard,
  5. full enablement.

## 13. Implementation Order

1. Prisma schema updates and migration.
2. Shared constants and risk-threshold utility.
3. Risk snapshot pipeline (on-demand + scheduled).
4. Hourly digest scheduler and notification delivery.
5. Insights aggregation service + rule engine.
6. Insights API with validation and cache.
7. Frontend dashboard integration.
8. End-to-end regression and production hardening.
