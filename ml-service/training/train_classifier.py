from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion

from common import (
    BASE_DIR,
    CLASSIFIER_PATH,
    RAW_CLASSIFIER_DIR,
    TFIDF_PATH,
    VALID_LABELS,
    clean_text,
    ensure_models_dir,
    infer_columns,
    read_csv,
    update_metadata,
)


def build_stop_words() -> list[str]:
    """Build a conservative stopword list while preserving negation semantics."""
    base_stop_words = set(ENGLISH_STOP_WORDS)

    # Keep negation tokens that are useful for productivity-state intent.
    keep_tokens = {
        "no",
        "not",
        "nor",
        "never",
        "cannot",
        "cant",
        "don't",
        "dont",
        "won't",
        "wont",
        "isn't",
        "isnt",
        "aren't",
        "arent",
    }
    for token in keep_tokens:
        base_stop_words.discard(token)

    # Remove discourse fillers that are frequent but mostly non-informative.
    base_stop_words.update(
        {
            "honestly",
            "basically",
            "frankly",
            "seriously",
            "literally",
            "truly",
            "genuinely",
            "obviously",
            "clearly",
            "really",
            "tbh",
            "lol",
            "smh",
            "ugh",
        }
    )

    return sorted(base_stop_words)


def parse_args() -> argparse.Namespace:
    """
    Sets up and parses command-line arguments. 
    This allows the user to override default training parameters without changing the code.
    """
    parser = argparse.ArgumentParser(description="Train Taskora text classifier locally.")
    parser.add_argument(
        "--dataset",
        type=Path,
        default=RAW_CLASSIFIER_DIR / "productivity_dataset_2.csv",
        help="Path to classifier dataset CSV.",
    )
    # Allows specifying exactly which columns contain the text and the target labels
    parser.add_argument("--text-col", type=str, default=None, help="Text column name.")
    parser.add_argument("--label-col", type=str, default=None, help="Label column name.")

    # Hyperparameters for the train/test split and vectorizer
    parser.add_argument("--test-size", type=float, default=0.2, help="Test set size ratio.")
    parser.add_argument("--random-state", type=int, default=42, help="Random seed.")
    parser.add_argument("--max-features", type=int, default=20000, help="TF-IDF max features.")
    parser.add_argument(
        "--char-max-features",
        type=int,
        default=8000,
        help="Character TF-IDF max features when char n-grams are enabled.",
    )
    parser.add_argument(
        "--disable-char-ngrams",
        action="store_true",
        help="Disable character n-gram TF-IDF branch.",
    )
    parser.add_argument(
        "--report-dir",
        type=Path,
        default=BASE_DIR / "reports" / "classifier",
        help="Directory to save classifier evaluation reports.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ensure_models_dir()

    df = read_csv(args.dataset)
    text_col, label_col = infer_columns(df, args.text_col, args.label_col)

    work_df = df[[text_col, label_col]].copy()
    work_df[text_col] = work_df[text_col].fillna("").map(clean_text)
    work_df[label_col] = work_df[label_col].astype(str).str.strip().str.upper()

    work_df = work_df[work_df[text_col] != ""]
    work_df = work_df[work_df[label_col].isin(VALID_LABELS)]

    if work_df.empty:
        raise ValueError("No valid rows found after preprocessing/filtering labels.")

    class_counts = work_df[label_col].value_counts()
    if (class_counts < 2).any():
        raise ValueError("Each class must have at least 2 samples for stratified split.")

    x_train, x_test, y_train, y_test = train_test_split(
        work_df[text_col],
        work_df[label_col],
        test_size=args.test_size,
        random_state=args.random_state,
        stratify=work_df[label_col],
    )

    word_vectorizer = TfidfVectorizer(
        max_features=args.max_features,
        ngram_range=(1, 3),
        min_df=1,
        sublinear_tf=True,
        stop_words=build_stop_words(),
    )

    vectorizer_steps: list[tuple[str, TfidfVectorizer]] = [("word_tfidf", word_vectorizer)]
    if not args.disable_char_ngrams:
        char_vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            min_df=2,
            max_features=args.char_max_features,
            sublinear_tf=True,
        )
        vectorizer_steps.append(("char_tfidf", char_vectorizer))

    vectorizer = FeatureUnion(vectorizer_steps)

    x_train_vec = vectorizer.fit_transform(x_train)
    x_test_vec = vectorizer.transform(x_test)

    classifier = LogisticRegression(
        max_iter=2000,
        random_state=args.random_state,
        class_weight="balanced",
        multi_class="multinomial",
    )
    classifier.fit(x_train_vec, y_train)

    y_pred = classifier.predict(x_test_vec)

    accuracy = float(accuracy_score(y_test, y_pred))
    macro_f1 = float(f1_score(y_test, y_pred, average="macro"))
    report = classification_report(y_test, y_pred, output_dict=True)

    args.report_dir.mkdir(parents=True, exist_ok=True)
    report_timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    report_path = args.report_dir / f"classifier_evaluation_{report_timestamp}.json"
    latest_report_path = args.report_dir / "classifier_evaluation_latest.json"

    evaluation_payload = {
        "dataset": str(args.dataset),
        "text_column": text_col,
        "label_column": label_col,
        "preprocessing": {
            "word_stopwords": "custom_english_preserve_negations",
            "char_ngrams_enabled": not args.disable_char_ngrams,
            "char_ngram_range": [3, 5] if not args.disable_char_ngrams else None,
            "word_ngram_range": [1, 3],
        },
        "metrics": {
            "accuracy": round(accuracy, 6),
            "macro_f1": round(macro_f1, 6),
        },
        "classification_report": report,
        "train_samples": int(len(x_train)),
        "test_samples": int(len(x_test)),
        "random_state": args.random_state,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    with report_path.open("w", encoding="utf-8") as file_obj:
        json.dump(evaluation_payload, file_obj, indent=2)
    with latest_report_path.open("w", encoding="utf-8") as file_obj:
        json.dump(evaluation_payload, file_obj, indent=2)

    joblib.dump(classifier, CLASSIFIER_PATH)
    joblib.dump(vectorizer, TFIDF_PATH)

    update_metadata(
        "classifier",
        {
            "dataset": str(args.dataset),
            "text_column": text_col,
            "label_column": label_col,
            "classes": sorted(list(set(work_df[label_col].tolist()))),
            "metrics": {
                "accuracy": round(accuracy, 6),
                "macro_f1": round(macro_f1, 6),
            },
            "preprocessing": {
                "word_stopwords": "custom_english_preserve_negations",
                "char_ngrams_enabled": not args.disable_char_ngrams,
                "char_ngram_range": [3, 5] if not args.disable_char_ngrams else None,
                "word_ngram_range": [1, 3],
            },
            "report": report,
            "artifacts": {
                "classifier": str(CLASSIFIER_PATH),
                "tfidf": str(TFIDF_PATH),
                "evaluation_report": str(latest_report_path),
            },
            "train_samples": int(len(x_train)),
            "test_samples": int(len(x_test)),
            "random_state": args.random_state,
        },
    )

    output = {
        "status": "ok",
        "accuracy": accuracy,
        "macro_f1": macro_f1,
        "classifier_path": str(CLASSIFIER_PATH),
        "tfidf_path": str(TFIDF_PATH),
        "evaluation_report_path": str(report_path),
        "latest_evaluation_report_path": str(latest_report_path),
    }
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
