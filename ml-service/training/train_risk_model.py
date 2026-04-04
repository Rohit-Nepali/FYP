from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import joblib
import matplotlib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from common import (
    PROCESSED_DIR,
    RAW_RISK_DIR,
    RISK_MODEL_PATH,
    RISK_PREPROCESSOR_PATH,
    ensure_models_dir,
    read_csv,
    update_metadata,
)

DEFAULT_FEATURES = [
    "is_completed",
    "due_in_days",
    "days_overdue",
    "recent_activity_count",
    "behavior_risk_score",
]

HIGH_RISK_LABELS = {"HIGH", "HIGH_RISK", "1", "TRUE", "YES"}

DEFAULT_PREPROCESSING_VIEW_COLUMNS = [
    "planned_duration_seconds",
    "elapsed_duration_seconds",
    "declaration_count",
    "declaration_total_seconds",
    "recent_activity_count",
]


def _numeric_series(series: pd.Series) -> pd.Series:
    if pd.api.types.is_datetime64_any_dtype(series):
        return series
    return pd.to_numeric(series, errors="coerce")


def _plot_histograms(df: pd.DataFrame, columns: list[str], output_path: Path, title: str) -> None:
    available_cols = [col for col in columns if col in df.columns]
    if not available_cols:
        return

    n_cols = 3
    n_rows = int(np.ceil(len(available_cols) / n_cols))
    fig, axes = plt.subplots(n_rows, n_cols, figsize=(5 * n_cols, 3.5 * n_rows))
    axes = np.array(axes).reshape(-1)

    for idx, column in enumerate(available_cols):
        axis = axes[idx]
        numeric_values = _numeric_series(df[column]).dropna()

        if numeric_values.empty:
            axis.text(0.5, 0.5, "No numeric data", ha="center", va="center", fontsize=10)
        else:
            axis.hist(numeric_values, bins=30, color="#2563eb", edgecolor="#1e3a8a", alpha=0.85)
            axis.set_ylabel("Frequency")

        axis.set_title(column)
        axis.grid(alpha=0.2)

    for idx in range(len(available_cols), len(axes)):
        axes[idx].axis("off")

    fig.suptitle(title, fontsize=14)
    fig.tight_layout(rect=[0, 0, 1, 0.96])
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=140)
    plt.close(fig)


def _plot_missingness(before_df: pd.DataFrame, after_df: pd.DataFrame, columns: list[str], output_path: Path) -> None:
    available_cols = [col for col in columns if col in before_df.columns or col in after_df.columns]
    if not available_cols:
        return

    before_missing = [
        float(before_df[col].isna().mean() * 100.0) if col in before_df.columns else 100.0
        for col in available_cols
    ]
    after_missing = [
        float(after_df[col].isna().mean() * 100.0) if col in after_df.columns else 100.0
        for col in available_cols
    ]

    x = np.arange(len(available_cols))
    width = 0.36

    fig, ax = plt.subplots(figsize=(max(8, len(available_cols) * 1.3), 4.8))
    ax.bar(x - width / 2, before_missing, width=width, label="Before preprocessing", color="#f59e0b")
    ax.bar(x + width / 2, after_missing, width=width, label="After preprocessing", color="#10b981")
    ax.set_ylabel("Missing (%)")
    ax.set_title("Missing value rate before vs after preprocessing")
    ax.set_xticks(x)
    ax.set_xticklabels(available_cols, rotation=30, ha="right")
    ax.set_ylim(0, 100)
    ax.legend()
    ax.grid(axis="y", alpha=0.25)
    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=140)
    plt.close(fig)


def _plot_correlation_heatmap(df: pd.DataFrame, columns: list[str], output_path: Path, title: str) -> None:
    available_cols = [col for col in columns if col in df.columns]
    if len(available_cols) < 2:
        return

    numeric_df = df[available_cols].apply(pd.to_numeric, errors="coerce")
    corr = numeric_df.corr()

    fig, ax = plt.subplots(figsize=(max(6, len(available_cols) * 1.1), max(5, len(available_cols) * 0.9)))
    im = ax.imshow(corr.values, cmap="coolwarm", vmin=-1, vmax=1)
    ax.set_xticks(range(len(available_cols)))
    ax.set_yticks(range(len(available_cols)))
    ax.set_xticklabels(available_cols, rotation=45, ha="right")
    ax.set_yticklabels(available_cols)
    ax.set_title(title)

    for row in range(len(available_cols)):
        for col in range(len(available_cols)):
            value = corr.values[row, col]
            if np.isnan(value):
                continue
            ax.text(col, row, f"{value:.2f}", ha="center", va="center", fontsize=8, color="#111827")

    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04, label="Correlation")
    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=140)
    plt.close(fig)


def _plot_class_balance(target: pd.Series | np.ndarray, output_path: Path, title: str) -> None:
    target_series = pd.Series(target)
    counts = target_series.value_counts().sort_index()
    if counts.empty:
        return

    fig, ax = plt.subplots(figsize=(6, 4))
    bars = ax.bar(counts.index.astype(str), counts.values, color=["#64748b", "#ef4444"][: len(counts)])
    ax.set_title(title)
    ax.set_xlabel("Class")
    ax.set_ylabel("Samples")
    ax.grid(axis="y", alpha=0.25)

    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2, height, f"{int(height)}", ha="center", va="bottom")

    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=140)
    plt.close(fig)


def _save_risk_visualizations(
    before_df: pd.DataFrame,
    after_df: pd.DataFrame,
    transformed_df: pd.DataFrame,
    target: pd.Series | np.ndarray,
    out_dir: Path,
    feature_cols: list[str],
    before_cols: list[str],
) -> None:
    before_dir = out_dir / "before_preprocessing"
    after_dir = out_dir / "after_preprocessing"

    _plot_histograms(
        before_df,
        before_cols,
        before_dir / "feature_histograms_before.png",
        "Feature distributions before preprocessing",
    )
    _plot_correlation_heatmap(
        before_df,
        before_cols,
        before_dir / "feature_correlation_before.png",
        "Feature correlation before preprocessing",
    )

    _plot_histograms(
        after_df,
        feature_cols,
        after_dir / "feature_histograms_after.png",
        "Feature distributions after preprocessing",
    )
    _plot_correlation_heatmap(
        after_df,
        feature_cols,
        after_dir / "feature_correlation_after.png",
        "Feature correlation after preprocessing",
    )
    _plot_histograms(
        transformed_df,
        transformed_df.columns.tolist(),
        after_dir / "scaled_feature_histograms_after.png",
        "Scaled feature distributions after preprocessing pipeline",
    )
    _plot_missingness(before_df, after_df, feature_cols, out_dir / "missingness_before_after.png")
    _plot_class_balance(target, out_dir / "target_class_balance.png", "Risk target class balance")


def parse_duration_to_seconds(value: object) -> float:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return 0.0

    if isinstance(value, (int, float, np.integer, np.floating)):
        numeric_value = float(value)
        if numeric_value > 1_000_000:
            # Gryzzly declaration durations are typically nanoseconds.
            return numeric_value / 1_000_000_000.0
        return numeric_value

    text_value = str(value).strip().lower()
    if text_value == "":
        return 0.0

    if text_value.isdigit():
        numeric_value = float(text_value)
        if numeric_value > 1_000_000:
            return numeric_value / 1_000_000_000.0
        return numeric_value

    pattern = re.compile(r"(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?")
    match = pattern.fullmatch(text_value)
    if match:
        hours = float(match.group(1) or 0.0)
        minutes = float(match.group(2) or 0.0)
        seconds = float(match.group(3) or 0.0)
        return (hours * 3600.0) + (minutes * 60.0) + seconds

    return 0.0


def normalize_bool(series: pd.Series) -> pd.Series:
    return (
        series.astype(str)
        .str.strip()
        .str.lower()
        .map({"true": 1, "false": 0, "t": 1, "f": 0, "1": 1, "0": 0})
        .fillna(0)
        .astype(int)
    )


def build_risk_training_dataset(raw_risk_dir: Path, processed_output: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    tasks_path = raw_risk_dir / "tasks.csv"
    tasks_computed_path = raw_risk_dir / "tasks_computed.csv"
    declarations_path = raw_risk_dir / "declarations.csv"

    tasks_df = read_csv(tasks_path)
    tasks_computed_df = read_csv(tasks_computed_path)
    declarations_df = read_csv(declarations_path)

    tasks_df = tasks_df.rename(columns={"id": "task_id", "created_at": "task_created_at"})
    tasks_computed_df = tasks_computed_df.rename(columns={"id": "task_id"})

    if "created_at" in tasks_computed_df.columns:
        tasks_computed_df = tasks_computed_df.rename(
            columns={"created_at": "task_computed_created_at"}
        )

    task_base = tasks_computed_df.merge(
        tasks_df[[col for col in tasks_df.columns if col in {"task_id", "task_created_at", "project_id"}]],
        on="task_id",
        how="left",
        suffixes=("", "_from_tasks"),
    )

    if "project_id_from_tasks" in task_base.columns:
        task_base["project_id"] = task_base["project_id"].fillna(task_base["project_id_from_tasks"])
        task_base = task_base.drop(columns=["project_id_from_tasks"])

    computed_created = task_base.get("task_computed_created_at")
    task_created = task_base.get("task_created_at")

    if computed_created is not None and task_created is not None:
        created_source = computed_created.fillna(task_created)
    elif computed_created is not None:
        created_source = computed_created
    elif task_created is not None:
        created_source = task_created
    else:
        created_source = pd.Series([None] * len(task_base))

    task_base["created_at"] = pd.to_datetime(created_source, errors="coerce", utc=True)

    task_base["planned_duration_seconds"] = task_base.get("planned_duration", 0).map(
        parse_duration_to_seconds
    )
    task_base["elapsed_duration_seconds"] = task_base.get("elapsed_duration", 0).map(
        parse_duration_to_seconds
    )

    if "is_container" in task_base.columns:
        task_base["is_container"] = normalize_bool(task_base["is_container"])
    else:
        task_base["is_container"] = 0

    task_base["has_parent"] = task_base.get("parent_id").notna().astype(int)

    declarations_df["decl_date"] = pd.to_datetime(
        declarations_df.get("date"), errors="coerce", utc=True
    )
    declarations_df["decl_created_at"] = pd.to_datetime(
        declarations_df.get("created_at"), errors="coerce", utc=True
    )
    declarations_df["decl_duration_seconds"] = declarations_df.get("duration", 0).map(
        parse_duration_to_seconds
    )

    now_utc = pd.Timestamp.now(tz="UTC")
    seven_days_ago = now_utc - pd.Timedelta(days=7)

    declarations_df["is_recent_7d"] = declarations_df["decl_date"].ge(seven_days_ago)

    decl_agg = declarations_df.groupby("task_id", dropna=False).agg(
        declaration_count=("id", "count"),
        declaration_total_seconds=("decl_duration_seconds", "sum"),
        declaration_active_days=("decl_date", lambda s: s.dt.date.nunique()),
        recent_activity_count=("is_recent_7d", "sum"),
        first_declaration_date=("decl_date", "min"),
        last_declaration_date=("decl_date", "max"),
    )

    risk_df = task_base.merge(decl_agg, on="task_id", how="left")

    preprocessed_snapshot = risk_df.copy()

    for col in [
        "declaration_count",
        "declaration_total_seconds",
        "declaration_active_days",
        "recent_activity_count",
    ]:
        risk_df[col] = risk_df[col].fillna(0)

    risk_df["is_completed"] = (
        (risk_df["elapsed_duration_seconds"] > 0)
        | (risk_df["declaration_total_seconds"] > 0)
    ).astype(int)

    risk_df["task_age_days"] = (
        (now_utc - risk_df["created_at"]).dt.total_seconds() / 86400.0
    )
    risk_df["task_age_days"] = risk_df["task_age_days"].replace([np.inf, -np.inf], np.nan).fillna(0)

    risk_df["completion_date"] = risk_df["last_declaration_date"].fillna(now_utc)
    risk_df["task_delay_days"] = (
        (risk_df["completion_date"] - risk_df["created_at"]).dt.total_seconds() / 86400.0
    )
    risk_df["task_delay_days"] = risk_df["task_delay_days"].replace([np.inf, -np.inf], np.nan).fillna(0)
    risk_df["task_delay_days"] = risk_df["task_delay_days"].clip(lower=0)

    planned_days = risk_df["planned_duration_seconds"] / 86400.0
    elapsed_days = risk_df["elapsed_duration_seconds"] / 86400.0

    risk_df["due_in_days"] = (planned_days - elapsed_days).clip(lower=0)
    risk_df["days_overdue"] = (risk_df["task_delay_days"] - planned_days).clip(lower=0)

    risk_df["task_frequency"] = risk_df["declaration_count"] / np.maximum(risk_df["task_age_days"], 1.0)
    risk_df["duration_ratio"] = np.where(
        risk_df["planned_duration_seconds"] > 0,
        risk_df["elapsed_duration_seconds"] / risk_df["planned_duration_seconds"],
        0.0,
    )

    risk_df["overdue_indicator"] = (
        (risk_df["duration_ratio"] > 1.2)
        | ((risk_df["is_completed"] == 0) & (risk_df["task_age_days"] > 7.0))
    ).astype(int)

    risk_df["project_id"] = risk_df["project_id"].fillna("UNKNOWN_PROJECT")
    risk_df["completion_rate_project"] = risk_df.groupby("project_id")["is_completed"].transform("mean")

    completion_component = 1.0 - risk_df["completion_rate_project"]
    activity_component = np.where(risk_df["task_frequency"] > 0, 1.0 / (1.0 + risk_df["task_frequency"]), 1.0)
    overdue_component = risk_df["overdue_indicator"].astype(float)

    risk_df["behavior_risk_score"] = (
        (0.4 * completion_component) + (0.3 * activity_component) + (0.3 * overdue_component)
    ).clip(lower=0.0, upper=1.0)

    risk_df["risk_target"] = (
        (risk_df["overdue_indicator"] == 1)
        | (risk_df["behavior_risk_score"] >= 0.65)
        | ((risk_df["is_completed"] == 0) & (risk_df["task_age_days"] >= 14))
    ).astype(int)

    if risk_df["risk_target"].nunique() < 2:
        # Ensure trainability if heuristics create a single class on small subsets.
        threshold = risk_df["behavior_risk_score"].quantile(0.7)
        risk_df["risk_target"] = (risk_df["behavior_risk_score"] >= threshold).astype(int)

    final_columns = [
        "task_id",
        "project_id",
        "is_completed",
        "due_in_days",
        "days_overdue",
        "recent_activity_count",
        "behavior_risk_score",
        "task_delay_days",
        "completion_rate_project",
        "task_frequency",
        "overdue_indicator",
        "risk_target",
    ]

    final_df = risk_df[final_columns].copy()
    processed_output.parent.mkdir(parents=True, exist_ok=True)
    final_df.to_csv(processed_output, index=False)
    return final_df, preprocessed_snapshot


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train Taskora risk prediction model locally.")
    parser.add_argument(
        "--raw-risk-dir",
        type=Path,
        default=RAW_RISK_DIR,
        help="Directory containing raw Gryzzly risk CSV files.",
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        default=PROCESSED_DIR / "risk_training.csv",
        help="Path to processed risk training CSV (auto-generated from raw input).",
    )
    parser.add_argument(
        "--target-col",
        type=str,
        default="risk_target",
        help="Target column name (binary or categorical).",
    )
    parser.add_argument(
        "--feature-cols",
        type=str,
        default=",".join(DEFAULT_FEATURES),
        help="Comma-separated feature column names.",
    )
    parser.add_argument("--test-size", type=float, default=0.2, help="Test set size ratio.")
    parser.add_argument("--random-state", type=int, default=42, help="Random seed.")
    parser.add_argument("--medium-threshold", type=float, default=0.45)
    parser.add_argument("--high-threshold", type=float, default=0.75)
    parser.add_argument(
        "--visualization-dir",
        type=Path,
        default=Path("reports") / "figures" / "risk",
        help="Directory to save before/after preprocessing visualization images.",
    )
    return parser.parse_args()


def normalize_target(raw_target) -> np.ndarray:
    values = []
    for value in raw_target:
        if isinstance(value, (bool, np.bool_)):
            values.append(1 if value else 0)
            continue

        if isinstance(value, (int, float, np.integer, np.floating)):
            values.append(1 if float(value) >= 1 else 0)
            continue

        normalized = str(value).strip().upper()
        values.append(1 if normalized in HIGH_RISK_LABELS else 0)

    return np.array(values, dtype=np.int64)


def main() -> None:
    args = parse_args()
    ensure_models_dir()

    df, before_snapshot = build_risk_training_dataset(args.raw_risk_dir, args.dataset)

    feature_cols = [col.strip() for col in args.feature_cols.split(",") if col.strip()]

    missing_features = [col for col in feature_cols if col not in df.columns]
    if missing_features:
        raise ValueError(f"Missing feature columns: {missing_features}")

    if args.target_col not in df.columns:
        raise ValueError(f"Missing target column: {args.target_col}")

    x = df[feature_cols].copy()

    if "is_completed" in x.columns:
        x["is_completed"] = x["is_completed"].astype(int)

    y = normalize_target(df[args.target_col].tolist())

    if len(np.unique(y)) < 2:
        raise ValueError("Target must include at least two classes.")

    # Persist visual EDA snapshots for both pre-cleaned and post-preprocessed data.
    scaled_input = x.copy()
    preprocessing_only = Pipeline(
        steps=[
            (
                "preprocessor",
                ColumnTransformer(
                    transformers=[
                        (
                            "numeric",
                            Pipeline(
                                steps=[
                                    ("imputer", SimpleImputer(strategy="median")),
                                    ("scaler", StandardScaler()),
                                ]
                            ),
                            feature_cols,
                        )
                    ]
                ),
            )
        ]
    )
    transformed_values = preprocessing_only.fit_transform(scaled_input)
    transformed_df = pd.DataFrame(transformed_values, columns=feature_cols)
    _save_risk_visualizations(
        before_df=before_snapshot,
        after_df=x,
        transformed_df=transformed_df,
        target=y,
        out_dir=args.visualization_dir,
        feature_cols=feature_cols,
        before_cols=DEFAULT_PREPROCESSING_VIEW_COLUMNS,
    )

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=args.test_size,
        random_state=args.random_state,
        stratify=y,
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                feature_cols,
            )
        ]
    )

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                LogisticRegression(
                    max_iter=2000,
                    random_state=args.random_state,
                    class_weight="balanced",
                ),
            ),
        ]
    )

    model.fit(x_train, y_train)

    y_pred = model.predict(x_test)
    y_proba = model.predict_proba(x_test)[:, 1]

    accuracy = float(accuracy_score(y_test, y_pred))
    macro_f1 = float(f1_score(y_test, y_pred, average="macro"))
    roc_auc = float(roc_auc_score(y_test, y_proba))
    report = classification_report(y_test, y_pred, output_dict=True)

    joblib.dump(model, RISK_MODEL_PATH)
    joblib.dump(model.named_steps["preprocessor"], RISK_PREPROCESSOR_PATH)

    update_metadata(
        "risk_model",
        {
            "raw_risk_dir": str(args.raw_risk_dir),
            "dataset": str(args.dataset),
            "target_column": args.target_col,
            "feature_columns": feature_cols,
            "metrics": {
                "accuracy": round(accuracy, 6),
                "macro_f1": round(macro_f1, 6),
                "roc_auc": round(roc_auc, 6),
            },
            "thresholds": {
                "medium": args.medium_threshold,
                "high": args.high_threshold,
            },
            "artifacts": {
                "risk_model": str(RISK_MODEL_PATH),
                "risk_preprocessor": str(RISK_PREPROCESSOR_PATH),
            },
            "report": report,
            "train_samples": int(len(x_train)),
            "test_samples": int(len(x_test)),
            "random_state": args.random_state,
        },
    )

    output = {
        "status": "ok",
        "accuracy": accuracy,
        "macro_f1": macro_f1,
        "roc_auc": roc_auc,
        "risk_model_path": str(RISK_MODEL_PATH),
        "visualization_dir": str(args.visualization_dir),
    }
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
