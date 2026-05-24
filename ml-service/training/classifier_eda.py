"""
EDA and visualization utilities for classifier training.
Generates visual reports for class distribution, feature importance, and model evaluation.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import auc, confusion_matrix, roc_curve
from sklearn.preprocessing import label_binarize

# Set style for all plots
sns.set_style("whitegrid")
plt.rcParams["figure.figsize"] = (12, 6)


def save_class_distribution(
    y_data: pd.Series,
    output_dir: Path,
    title: str = "Class Distribution",
    filename: str = "class_distribution.png",
) -> Path:
    """Save a bar chart of class distribution."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    class_counts = y_data.value_counts().sort_index()
    
    fig, ax = plt.subplots(figsize=(12, 6))
    class_counts.plot(kind="bar", ax=ax, color="steelblue", edgecolor="black")
    ax.set_title(title, fontsize=14, fontweight="bold")
    ax.set_xlabel("Class", fontsize=12)
    ax.set_ylabel("Count", fontsize=12)
    ax.grid(axis="y", alpha=0.3)
    plt.xticks(rotation=45, ha="right")
    
    # Add value labels on bars
    for container in ax.containers:
        ax.bar_label(container, fontsize=10)
    
    output_path = output_dir / filename
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    
    return output_path


def save_text_length_distribution(
    texts: pd.Series,
    labels: pd.Series,
    output_dir: Path,
    title: str = "Text Length Distribution by Class",
    filename: str = "text_length_distribution.png",
) -> Path:
    """Save a box plot of text length distribution by class."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    df = pd.DataFrame({"text_length": texts.str.split().str.len(), "class": labels})
    
    fig, ax = plt.subplots(figsize=(12, 6))
    sns.boxplot(data=df, x="class", y="text_length", ax=ax, palette="Set2")
    ax.set_title(title, fontsize=14, fontweight="bold")
    ax.set_xlabel("Class", fontsize=12)
    ax.set_ylabel("Number of Tokens", fontsize=12)
    plt.xticks(rotation=45, ha="right")
    
    output_path = output_dir / filename
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    
    return output_path


def save_confusion_matrix(
    y_true: np.ndarray | pd.Series,
    y_pred: np.ndarray | pd.Series,
    output_dir: Path,
    classes: Optional[list[str]] = None,
    title: str = "Confusion Matrix",
    filename: str = "confusion_matrix.png",
) -> Path:
    """Save a confusion matrix heatmap."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    cm = confusion_matrix(y_true, y_pred, labels=classes)
    
    fig, ax = plt.subplots(figsize=(10, 8))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=classes,
        yticklabels=classes,
        ax=ax,
        cbar_kws={"label": "Count"},
    )
    ax.set_title(title, fontsize=14, fontweight="bold")
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("True", fontsize=12)
    
    output_path = output_dir / filename
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    
    return output_path


def save_roc_curve(
    y_true: np.ndarray | pd.Series,
    y_score: np.ndarray,
    classes: list[str],
    output_dir: Path,
    title: str = "ROC Curve (Test Set)",
    filename: str = "08_roc_curve.png",
) -> Path:
    """Save one-vs-rest ROC curves for a multiclass classifier."""
    output_dir.mkdir(parents=True, exist_ok=True)

    y_true_binarized = label_binarize(y_true, classes=classes)
    if y_true_binarized.shape[1] == 1:
        y_true_binarized = np.hstack([1 - y_true_binarized, y_true_binarized])

    fig, ax = plt.subplots(figsize=(10, 8))
    for index, class_label in enumerate(classes):
        fpr, tpr, _ = roc_curve(y_true_binarized[:, index], y_score[:, index])
        roc_auc = auc(fpr, tpr)
        ax.plot(fpr, tpr, linewidth=2, label=f"{class_label} (AUC = {roc_auc:.3f})")

    ax.plot([0, 1], [0, 1], linestyle="--", color="gray", linewidth=1.5, label="Chance")
    ax.set_title(title, fontsize=14, fontweight="bold")
    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate", fontsize=12)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1.05)
    ax.grid(alpha=0.3)
    ax.legend(loc="lower right", fontsize=8)

    output_path = output_dir / filename
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()

    return output_path


def save_algorithm_comparison(
    models_metrics: dict[str, dict[str, float]],
    baseline_metrics: dict[str, float],
    output_dir: Path,
    title: str = "Model vs Baseline on Test Data",
    filename: str = "09_algorithm_comparison.png",
) -> Path:
    """Save a grouped comparison chart for multiple models vs a baseline."""
    output_dir.mkdir(parents=True, exist_ok=True)

    metric_names = ["accuracy", "macro_f1"]

    # Build labels order: models first, then baseline
    labels = list(models_metrics.keys()) + ["Majority baseline"]

    # Gather values for each label and metric
    values = []
    for lbl in models_metrics.keys():
        values.append([models_metrics[lbl].get(m, 0.0) for m in metric_names])
    # append baseline
    values.append([baseline_metrics.get(m, 0.0) for m in metric_names])

    values = np.array(values)  # shape (n_labels, n_metrics)

    n_labels = values.shape[0]
    n_metrics = values.shape[1]

    x = np.arange(n_metrics)
    total_width = 0.8
    width = total_width / n_labels

    fig, ax = plt.subplots(figsize=(10, 6))

    cmap = plt.get_cmap("tab10")
    bars = []
    for i in range(n_labels):
        offsets = x - total_width / 2 + (i + 0.5) * width
        bar = ax.bar(offsets, values[i], width=width, label=labels[i], color=cmap(i % 10))
        bars.append(bar)

    ax.set_title(title, fontsize=14, fontweight="bold")
    ax.set_ylabel("Score", fontsize=12)
    ax.set_ylim(0, 1.05)
    ax.set_xticks(x)
    ax.set_xticklabels([name.replace("_", " ").title() for name in metric_names])
    ax.grid(axis="y", alpha=0.3)
    ax.legend(loc="upper right")

    for bar_group in bars:
        ax.bar_label(bar_group, fmt="%.3f", fontsize=9)

    output_path = output_dir / filename
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()

    return output_path


def save_top_features_per_class(
    vectorizer: TfidfVectorizer,
    classifier,
    output_dir: Path,
    top_n: int = 15,
    title: str = "Top Features per Class",
    filename: str = "top_features_per_class.png",
) -> Path:
    """Save bar plot of top TF-IDF features for each class."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    feature_names = np.array(vectorizer.get_feature_names_out())
    classes = classifier.classes_
    n_classes = len(classes)
    
    # Calculate number of subplots needed
    n_cols = 3
    n_rows = (n_classes + n_cols - 1) // n_cols
    
    fig, axes = plt.subplots(n_rows, n_cols, figsize=(18, 4 * n_rows))
    axes = axes.flatten() if n_rows * n_cols > 1 else [axes]
    
    for idx, class_label in enumerate(classes):
        coef = classifier.coef_[idx]
        top_indices = np.argsort(np.abs(coef))[-top_n:]
        top_features = feature_names[top_indices]
        top_coef = coef[top_indices]
        
        colors = ["green" if c > 0 else "red" for c in top_coef]
        axes[idx].barh(range(len(top_features)), top_coef, color=colors, edgecolor="black")
        axes[idx].set_yticks(range(len(top_features)))
        axes[idx].set_yticklabels(top_features, fontsize=9)
        axes[idx].set_xlabel("Coefficient", fontsize=10)
        axes[idx].set_title(f"Top Features: {class_label}", fontsize=11, fontweight="bold")
        axes[idx].grid(axis="x", alpha=0.3)
    
    # Hide unused subplots
    for idx in range(len(classes), len(axes)):
        axes[idx].set_visible(False)
    
    fig.suptitle(title, fontsize=14, fontweight="bold", y=1.00)
    plt.tight_layout()
    
    output_path = output_dir / filename
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    
    return output_path


def save_per_class_metrics(
    report_dict: dict,
    classes: list[str],
    output_dir: Path,
    title: str = "Per-Class Performance Metrics",
    filename: str = "per_class_metrics.png",
) -> Path:
    """Save bar plot of per-class precision, recall, f1-score."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    metrics = ["precision", "recall", "f1-score"]
    data = {}
    
    for metric in metrics:
        data[metric] = [report_dict[cls].get(metric, 0) for cls in classes]
    
    df = pd.DataFrame(data, index=classes)
    
    fig, ax = plt.subplots(figsize=(12, 6))
    df.plot(kind="bar", ax=ax, color=["#1f77b4", "#ff7f0e", "#2ca02c"], edgecolor="black")
    ax.set_title(title, fontsize=14, fontweight="bold")
    ax.set_xlabel("Class", fontsize=12)
    ax.set_ylabel("Score", fontsize=12)
    ax.set_ylim([0, 1.05])
    ax.grid(axis="y", alpha=0.3)
    ax.legend(title="Metric", loc="lower right")
    plt.xticks(rotation=45, ha="right")
    
    output_path = output_dir / filename
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    
    return output_path


def save_dataset_overview(
    work_df: pd.DataFrame,
    text_col: str,
    label_col: str,
    train_size: int,
    test_size: int,
    output_dir: Path,
    filename: str = "dataset_overview.txt",
) -> Path:
    """Save a text report with dataset overview."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = output_dir / filename
    
    with output_path.open("w", encoding="utf-8") as f:
        f.write("=" * 60 + "\n")
        f.write("CLASSIFIER DATASET OVERVIEW\n")
        f.write("=" * 60 + "\n\n")
        
        f.write(f"Total samples after preprocessing: {len(work_df)}\n")
        f.write(f"Train samples: {train_size}\n")
        f.write(f"Test samples: {test_size}\n")
        f.write(f"Train/Test split: {train_size / (train_size + test_size):.2%} / {test_size / (train_size + test_size):.2%}\n\n")
        
        f.write("CLASS DISTRIBUTION:\n")
        f.write("-" * 60 + "\n")
        class_counts = work_df[label_col].value_counts().sort_index()
        for cls, count in class_counts.items():
            percentage = (count / len(work_df)) * 100
            f.write(f"  {cls:<30} {count:>6} ({percentage:>5.1f}%)\n")
        f.write("\n")
        
        f.write("TEXT STATISTICS:\n")
        f.write("-" * 60 + "\n")
        text_lengths = work_df[text_col].str.split().str.len()
        f.write(f"  Mean tokens per text: {text_lengths.mean():.2f}\n")
        f.write(f"  Median tokens per text: {text_lengths.median():.2f}\n")
        f.write(f"  Min tokens: {text_lengths.min()}\n")
        f.write(f"  Max tokens: {text_lengths.max()}\n")
        f.write(f"  Std dev: {text_lengths.std():.2f}\n\n")
        
        f.write("PREPROCESSING APPLIED:\n")
        f.write("-" * 60 + "\n")
        f.write("  - Lowercasing\n")
        f.write("  - Special character removal\n")
        f.write("  - Digit removal\n")
        f.write("  - Whitespace normalization\n")
        f.write("  - Lemmatization (simplemma, English)\n")
    
    return output_path


def generate_all_eda_reports(
    work_df: pd.DataFrame,
    x_train: pd.Series,
    x_test: pd.Series,
    y_train: pd.Series,
    y_test: pd.Series,
    y_pred: np.ndarray,
    y_score: np.ndarray,
    vectorizer,
    classifier,
    report_dict: dict,
    baseline_metrics: dict[str, float] | None,
    text_col: str,
    label_col: str,
    output_dir: Path,
    other_models_metrics: dict[str, dict[str, float]] | None = None,
) -> dict[str, Path]:
    """Generate all EDA visualizations and save them to output_dir."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create subdirectories
    figures_dir = output_dir / "figures"
    figures_dir.mkdir(exist_ok=True)
    
    report_paths = {}
    
    # 1. Class distribution (overall dataset)
    report_paths["class_distribution_overall"] = save_class_distribution(
        work_df[label_col],
        figures_dir,
        title="Class Distribution (Full Dataset)",
        filename="01_class_distribution_overall.png",
    )
    
    # 2. Class distribution (train set)
    report_paths["class_distribution_train"] = save_class_distribution(
        y_train,
        figures_dir,
        title="Class Distribution (Training Set)",
        filename="02_class_distribution_train.png",
    )
    
    # 3. Class distribution (test set)
    report_paths["class_distribution_test"] = save_class_distribution(
        y_test,
        figures_dir,
        title="Class Distribution (Test Set)",
        filename="03_class_distribution_test.png",
    )
    
    # 4. Text length distribution
    report_paths["text_length_distribution"] = save_text_length_distribution(
        work_df[text_col],
        work_df[label_col],
        figures_dir,
        title="Text Length Distribution by Class",
        filename="04_text_length_distribution.png",
    )
    
    # 5. Confusion matrix
    report_paths["confusion_matrix"] = save_confusion_matrix(
        y_test,
        y_pred,
        figures_dir,
        classes=classifier.classes_,
        title="Confusion Matrix (Test Set)",
        filename="05_confusion_matrix.png",
    )
    
    # 6. ROC curve
    report_paths["roc_curve"] = save_roc_curve(
        y_test,
        y_score,
        list(classifier.classes_),
        figures_dir,
        title="One-vs-Rest ROC Curve (Test Set)",
        filename="08_roc_curve.png",
    )

    # 7. Top features per class
    report_paths["top_features"] = save_top_features_per_class(
        vectorizer,
        classifier,
        figures_dir,
        top_n=15,
        title="Top Features per Class (by Coefficient)",
        filename="06_top_features_per_class.png",
    )
    
    # 8. Per-class metrics
    report_paths["per_class_metrics"] = save_per_class_metrics(
        report_dict,
        classifier.classes_,
        figures_dir,
        title="Per-Class Performance Metrics",
        filename="07_per_class_metrics.png",
    )

    if baseline_metrics is not None:
        # 9. Model-vs-baseline comparison (support multiple models)
        models_metrics = {"Taskora model": {"accuracy": float(report_dict["accuracy"]), "macro_f1": float(report_dict["macro avg"]["f1-score"])}}
        if other_models_metrics:
            for k, v in other_models_metrics.items():
                models_metrics[k] = {"accuracy": float(v.get("accuracy", 0.0)), "macro_f1": float(v.get("macro_f1", 0.0))}

        report_paths["algorithm_comparison"] = save_algorithm_comparison(
            models_metrics,
            baseline_metrics,
            figures_dir,
            title="Model vs Majority Baseline on Test Data",
            filename="09_algorithm_comparison.png",
        )
    
    # 10. Dataset overview (text report)
    report_paths["dataset_overview"] = save_dataset_overview(
        work_df,
        text_col,
        label_col,
        len(x_train),
        len(x_test),
        figures_dir,
        filename="00_dataset_overview.txt",
    )
    
    return report_paths
