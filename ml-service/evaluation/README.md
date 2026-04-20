# Classifier Evaluation

This folder contains real-world evaluation scripts to test the productivity state classifier on realistic, informal, and ambiguous user inputs.

## Real-World Test Suite

**Script:** `real_world_classifier_test.py`

Evaluates the classifier on inputs that:
- Are ambiguous (overlap multiple classes)
- Use informal/slangy language never seen during training
- Are very short with minimal signal
- Lack obvious class-indicative keywords

### Run the evaluation

**From the `ml-service` directory:**

```bash
python evaluation/real_world_classifier_test.py
```

**Or with venv activation (from project root):**

```bash
.venv\Scripts\Activate.ps1
cd ml-service
python evaluation/real_world_classifier_test.py
```

**Or directly with venv Python:**

```bash
d:\Uni\FInal Year Project\Taskora\.venv\Scripts\python.exe evaluation/real_world_classifier_test.py
```

### Output interpretation

The script prints a table with:

| Column | Meaning |
|--------|---------|
| `⚠` | Low confidence (< 0.60) — model uncertain |
| `~` | Medium confidence (0.60–0.85) — reasonable prediction |
| `✓` | High confidence (> 0.85) — strong prediction |
| `Input` | User text (as cleaned and lowercased) |
| `Predicted` | Classifier's chosen label |
| `Conf` | Confidence score (0.0–1.0) |
| `Expected` | What the label should ideally be |

### Prerequisites

- Trained models must exist:
  - `models/taskora_classifier.pkl`
  - `models/taskora_tfidf.pkl`

Run the training script first if models do not exist:

```bash
python training/train_classifier.py
```

## Insights

This evaluation helps identify:
1. **Domain gaps**: Does the model handle real user language?
2. **Ambiguity**: Are predictions stable/confident on overlapping cases?
3. **Shortcut learning**: Does the model rely on uncommon keywords?
4. **Generalization**: How robust is it to informal text?

Use results to inform data augmentation, rebalancing, or model architecture changes.
