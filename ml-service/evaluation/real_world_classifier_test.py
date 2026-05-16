"""
Real-world classifier evaluation script.

Tests the productivity state classifier on informal, ambiguous, and unseen language patterns
that real users would type. Evaluates robustness beyond the training dataset.
"""

import re
from pathlib import Path

import joblib


def load_models():
    """Load the classifier and vectorizer from the models directory."""
    base_dir = Path(__file__).resolve().parent.parent
    classifier_path = base_dir / "models" / "taskora_classifier.pkl"
    vectorizer_path = base_dir / "models" / "taskora_tfidf.pkl"

    if not classifier_path.exists() or not vectorizer_path.exists():
        raise FileNotFoundError(
            f"Models not found. Ensure trained models exist at:\n"
            f"  - {classifier_path}\n"
            f"  - {vectorizer_path}"
        )

    classifier = joblib.load(classifier_path)
    vectorizer = joblib.load(vectorizer_path)
    return classifier, vectorizer


def predict(text: str, vectorizer, classifier) -> tuple[str, float]:
    """
    Predict productivity state from user text.
    
    Args:
        text: Raw user input text
        vectorizer: Fitted TF-IDF vectorizer
        classifier: Fitted classifier model
        
    Returns:
        Tuple of (predicted_label, confidence)
    """
    # Apply same cleaning as training pipeline
    cleaned = re.sub(r"[^a-z0-9\s']", "", text.lower())
    cleaned = re.sub(r"\d+", "", cleaned).strip()
    vec = vectorizer.transform([cleaned])
    label = classifier.predict(vec)[0]
    conf = classifier.predict_proba(vec).max()
    return label, round(float(conf), 3)


def main() -> None:
    """Run evaluation on real-world test cases."""
    classifier, vectorizer = load_models()

    # Real-world test cases designed to reveal model gaps
    real_world_tests = [
        # Ambiguous — should be hard
        ("I have so much to do and no energy to do any of it", "WORK_OVERLOAD or LOW_ENERGY"),
        ("been putting things off because im exhausted", "PROCRASTINATION or LOW_ENERGY"),
        ("cant focus, too tired, and way behind", "DISTRACTION or LOW_ENERGY or WORK_OVERLOAD"),
        
        # Informal/slangy — never seen by model
        ("lol havent touched that task in days", "PROCRASTINATION"),
        ("my brain is cooked rn", "LOW_ENERGY"),
        ("swamped fr", "WORK_OVERLOAD"),
        ("kept tabbing out all day smh", "DISTRACTION"),
        
        # Very short — low signal
        ("too much", "WORK_OVERLOAD"),
        ("forgot again", "FORGETFULNESS"),
        ("no motivation", "LOW_ENERGY or HIGH_MOTIVATION"),
        
        # No generator keywords at all
        ("the list just keeps growing", "WORK_OVERLOAD"),
        ("ended up watching netflix for 3 hours", "PROCRASTINATION"),
        ("woke up already dreading the day", "LOW_ENERGY"),
    ]

    print(f"{'Input':<55} {'Predicted':<25} {'Conf':<8} {'Expected'}")
    print("─" * 110)
    
    for text, expected in real_world_tests:
        label, conf = predict(text, vectorizer, classifier)
        # Confidence flags: ⚠ = low, ~ = medium, ✓ = high
        flag = "⚠" if conf < 0.6 else ("✓" if conf > 0.85 else "~")
        print(f"{flag} {text:<53} {label:<25} {conf:<8} {expected}")


if __name__ == "__main__":
    main()
