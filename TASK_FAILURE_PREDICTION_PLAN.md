## Plan: Colab-Ready Missed Task Predictor

Create a clean training pipeline in Google Colab using Gryzzly CSVs and align the resulting artifacts with Taskora backend/ML-service integration. The plan is implementation-ready, but execution remains in Colab/backend handoff.

**Steps**
1. Phase A — Notebook setup and schema lock (*blocks all next steps*)
   - Load only required CSVs: users, teams, declarations, projects, projects_computed, tasks, tasks_computed.
   - Assert expected headers exist before transformations.
   - Standardize column naming policy (snake_case retained as-is).

2. Phase B — Type normalization layer (*depends on 1*)
   - Parse timestamps to UTC datetimes: `created_at`, `deleted_at`, `date`.
   - Parse duration strings to numeric minutes/seconds:
     - `declarations.duration`
     - `tasks_computed.planned_duration`, `tasks_computed.elapsed_duration`
     - `projects_computed.planned_duration`, `projects_computed.elapsed_duration`
   - Create parse-failure flags for each parsed duration field.

3. Phase C — Canonical relational model (*depends on 1,2*)
   - Task spine:
     - `task_base = tasks_computed LEFT JOIN tasks ON id`
   - Project enrichment:
     - `task_base LEFT JOIN projects ON task_base.project_id = projects.id`
     - `task_base LEFT JOIN projects_computed ON task_base.project_id = projects_computed.id`
   - Declaration enrichment:
     - Aggregate declarations by `task_id`
     - Aggregate declarations by `user_id`
   - Team/user enrichment:
     - `users.team_id -> teams.id`
     - optional project-team consistency checks (`projects.team_id`).

4. Phase D — Feature table construction (*depends on 3*)
   - Task-level features:
     - `is_container`, `has_parent`, `task_age_days`
     - `planned_duration_min`, `elapsed_duration_min`, `duration_ratio`
   - Project-level features:
     - `project_planned_duration_min`, `project_elapsed_duration_min`, `project_duration_ratio`
     - `project_task_count`
   - Declarations/task features:
     - `decl_count_task`, `decl_total_min_task`, `decl_avg_min_task`
     - `decl_active_days_task`, `decl_last_date_task`, `days_since_last_decl_task`
     - `decl_source_entropy_task` or `decl_source_mode_task`
   - User-level declaration features:
     - `decl_count_user`, `user_avg_daily_min`, `user_std_daily_min`
     - `user_max_inactivity_gap_days`, `user_recent_7d_min`, `user_recent_30d_min`
     - `user_recent_ratio_7d_30d`
   - Hierarchy/team features:
     - `sibling_count`, `project_team_user_density` (if computable from joins)

5. Phase E — Target variable design (`missed_task`) (*depends on 3,4*)
   - Use hybrid target based only on available data:
     - Rule A (overrun): `planned_duration_min > 0` and `elapsed_duration_min / planned_duration_min > threshold_overrun`
     - Rule B (weak execution): `decl_count_task == 0` OR `decl_total_min_task` below minimal threshold
     - Rule C (inactivity): `days_since_last_decl_task >= threshold_inactivity`
   - Label:
     - `missed_task = 1` if `Rule A` OR (`Rule B` AND `Rule C`), else `0`
   - Initial thresholds:
     - `threshold_overrun = 1.20`
     - `threshold_inactivity = 5 to 7 days`
   - Calibrate with class-balance and precision/recall review.

6. Phase F — X/y and leakage guardrails (*depends on 4,5*)
   - Define `X` as engineered predictors only.
   - Define `y = missed_task`.
   - Exclude from `X`:
     - identifiers (`id`, `task_id`, `project_id`, `user_id`, `team_id`)
     - direct label components if used as hard-rule target in final experiment variant
     - post-outcome columns unavailable at inference time.
   - Maintain two experiment tracks:
     - Track 1: rule-derived label with full feature set (minus leakage)
     - Track 2: conservative feature set that mirrors online prediction availability.

7. Phase G — Data quality report (*parallel with 6 after 3*)
   - Null-rate matrix per column and per join stage.
   - FK coverage diagnostics:
     - declarations.task_id in tasks ids
     - declarations.user_id in users ids
     - tasks.project_id in projects ids
     - users.team_id and projects.team_id in teams ids
   - Duplicates on key columns and potential many-to-many inflation checks.
   - Duration parsing error counts and outlier quantiles.

8. Phase H — Modeling handoff package (*depends on 6,7*)
   - Export final training table snapshot metadata (not raw sensitive dump if avoidable).
   - Save feature dictionary (name, type, derivation, availability-online).
   - Save target-definition document (rules + thresholds + rationale).

9. Phase I — Backend alignment implementation plan (*depends on 5,8*)
   - Current coverage in Taskora:
     - deadline: available (`Task.dueDate`)
     - completion status: available (`Task.isCompleted`)
     - progress history: NOT AVAILABLE as structured transitions
   - Required schema improvements for stronger production labels/features:
     - `Task.completedAt` (NOT AVAILABLE)
     - `Task.estimatedDuration` (NOT AVAILABLE)
     - `Task.actualDuration` (NOT AVAILABLE)
     - `Task.missedReason` enum/text (NOT AVAILABLE)
     - status-transition log entity (NOT AVAILABLE)

10. Phase J — Online prediction integration design (*depends on 9*)
   - Prediction triggers:
     - task creation (baseline)
     - task update affecting risk-related fields
     - periodic daily batch for open tasks
   - API contract:
     - `POST /predict-task-risk`
     - request: task/project/user aggregated features
     - response: `risk`, `probability`, `top_factors`, `generated_at`
   - Persistence:
     - Store latest risk per task + historical snapshots for drift/audit.
   - Consumption:
     - dashboard risk badges
     - chatbot proactive nudges for high-risk tasks.

**Relevant files**
- `Gryzzly_Datasets/users.csv` — user-team linkage
- `Gryzzly_Datasets/teams.csv` — team master
- `Gryzzly_Datasets/declarations.csv` — activity logs (`duration`, `source`, `user_id`, `task_id`)
- `Gryzzly_Datasets/projects.csv` — project-team relation
- `Gryzzly_Datasets/projects_computed.csv` — project duration aggregates
- `Gryzzly_Datasets/tasks.csv` — task hierarchy/project link
- `Gryzzly_Datasets/tasks_computed.csv` — task duration aggregates
- `server/prisma/schema.prisma` — current Taskora DB schema
- `server/src/services/task.service.js` — task lifecycle handling
- `server/src/services/project.service.js` — overdue/statistics logic
- `server/src/services/chatbot.service.js` — missed-task conversational signal capture
- `server/src/services/mlClassification.service.js` — existing ML endpoint adapter
- `ml-service/main.py` — current ML microservice endpoint layout

**Verification**
1. Confirm all join keys and relation assumptions with FK coverage metrics.
2. Confirm duration parsing success rate and no silent parse coercion.
3. Confirm final table has stable row grain: one row per task.
4. Confirm leakage checks pass for chosen modeling track.
5. Confirm label prevalence is trainable (not extreme minority without balancing strategy).
6. Confirm online feature availability parity for production inference.

**Decisions**
- Use hybrid target strategy due absence of explicit deadline/completion columns in Gryzzly task CSV headers.
- Use `tasks_computed` as primary base for duration-aware risk modeling.
- Keep plan implementation-focused; avoid schema assumptions beyond observed headers/code.
- Scope is planning + architecture; execution in Colab/backend to follow.

**Further Considerations**
1. Add time-split validation in Colab to avoid temporal leakage (train on past, validate on future).
2. Keep both binary risk class and probability score for product UX.
3. Revisit target thresholds after first confusion-matrix review to balance false alarms vs misses.