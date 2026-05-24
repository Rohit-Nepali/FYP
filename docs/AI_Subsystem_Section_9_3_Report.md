# 9.3 AI Subsystem Report

## 9.3.1 AI System Implemented
Taskora does not use a path-finding or shortest-route algorithm in this subsystem. The implemented AI is a supervised text-classification pipeline that assigns productivity-state labels to user messages. The classifier is trained offline and then served through the FastAPI ML microservice.

Because this is not a routing problem, the usual path-finding terms do not apply:
- Initial state: user text after preprocessing
- Successor function: not applicable
- Goal test: classify the text into one of the valid productivity labels
- Path cost: not applicable

The AI output is used to support chatbot-style behavioural analysis and downstream productivity insights.

## 9.3.2 PEAS Description
This subsystem is software-based, so a strict PEAS description for mechanical devices is not applicable. For completeness, the equivalent software PEAS view is:

| Element | Description |
|---|---|
| Performance | High classification accuracy, stable confidence scores, low inference latency, and reliable label consistency |
| Environment | Free-text user reflections, task comments, and productivity-related messages inside Taskora |
| Actuator | API responses returned by the ML service, including predicted label and confidence |
| Sensor | Incoming text payloads, cleaned text, and dataset inputs used during training |

## 9.3.3 Environment Portfolio
There are no mechanical devices in this subsystem, so a physical environment portfolio is not required. The operational environment is digital and consists of:
- the mobile client text input surface,
- the FastAPI ML service,
- the trained classifier and vectorizer artifacts,
- the evaluation and reporting outputs saved during training.

## 9.3.4 Data Collection
The classifier was trained using the Taskora productivity dataset stored at:
- [ml-service/training/raw/classifier/productivity_dataset_4.csv](../ml-service/training/raw/classifier/productivity_dataset_4.csv)

The current training run used:
- 10,000 total labelled samples in the generated dataset family
- 9,776 training samples
- 224 test samples
- 8 productivity-state labels

The dataset is split-aware, which means the training script can use the predefined train/test split when the source CSV contains a `split` column. The current evaluation run used the predefined split.

## 9.3.5 Model Development
The implemented model is a Logistic Regression text classifier built on top of TF-IDF features.

Key design choices:
- Word TF-IDF features with n-grams from 1 to 3
- Character TF-IDF features with n-grams from 3 to 5
- A custom stopword list that preserves negation words such as not, no, and never
- Class weighting enabled to reduce bias toward majority classes
- Preprocessing with cleaning and lemmatization through the shared Taskora text pipeline

The model is trained in `ml-service/training/train_classifier.py` and the EDA/report figures are generated in `ml-service/training/classifier_eda.py`.

## 9.3.6 Optimization and Evaluation
The model is evaluated on the holdout test split after training. The current run produced the following results:

- Accuracy: 0.821429
- Macro F1: 0.811106
- Macro ROC AUC: 0.964731
- Majority-class baseline accuracy: 0.080357
- Majority-class baseline macro F1: 0.018595
- Leakage check: 3 of 224 test samples above the similarity threshold of 0.92

The large gap between the model and the baseline shows that the classifier is learning useful class boundaries rather than simply predicting the dominant class.

## 9.3.7 Integration into the Application
The AI subsystem is integrated as a standalone FastAPI microservice in `ml-service/main.py`.

Integration points:
- `POST /classify` receives user text and returns the predicted label and confidence
- `GET /health` reports whether the classifier and vectorizer are loaded
- `POST /retrain-risk-model` supports gated model retraining for the risk subsystem
- The trained artifacts are loaded through `ml_engine.py` at service startup

The mobile client can call the classification endpoint whenever it needs behavioural analysis from typed user text. The model outputs are therefore part of the application flow rather than a separate offline script.

## 9.3.8 Comparing Algorithm Performance With Test Data
The project now generates a poster-ready comparison chart at:
- [ml-service/reports/classifier/figures/09_algorithm_comparison.png](../ml-service/reports/classifier/figures/09_algorithm_comparison.png)

The chart compares the implemented classifier against a majority-class baseline on the same test set.

Observed results:
- Taskora model accuracy: 0.821429
- Baseline accuracy: 0.080357
- Taskora model macro F1: 0.811106
- Baseline macro F1: 0.018595

This comparison provides a clear performance story for academic presentation because it shows the improvement over a naive prediction strategy.

## 9.3.9 AI Testing and Accuracy Plotting
To support poster presentation and visual evaluation, the training pipeline now generates:
- a confusion matrix,
- a multiclass ROC curve,
- a model-vs-baseline comparison figure.

The ROC curve is saved at:
- [ml-service/reports/classifier/figures/08_roc_curve.png](../ml-service/reports/classifier/figures/08_roc_curve.png)

The evaluation script and training report now expose an overall ROC AUC score of 0.964731, which is strong for a multiclass text classifier.

If you want a simple A/B-style presentation diagram, the model-vs-baseline chart is the best option because it is easy to explain visually and requires no extra assumptions.

## 9.3.10 Confusion Matrix
The confusion matrix is saved at:
- [ml-service/reports/classifier/figures/05_confusion_matrix.png](../ml-service/reports/classifier/figures/05_confusion_matrix.png)

It shows where the classifier performs well and where classes overlap. The strongest classes are the ones with distinctive language patterns, while the weaker areas tend to be semantically close categories such as low energy, distraction, and procrastination.

The latest evaluation report is stored at:
- [ml-service/reports/classifier/classifier_evaluation_latest.json](../ml-service/reports/classifier/classifier_evaluation_latest.json)

## 9.3.11 ROC Curve
The ROC curve is useful for showing how well the model separates each class across probability thresholds. In the current implementation, the curve is generated as a one-vs-rest multiclass ROC plot.

The generated ROC artifact is saved at:
- [ml-service/reports/classifier/figures/08_roc_curve.png](../ml-service/reports/classifier/figures/08_roc_curve.png)

A macro ROC AUC of 0.964731 indicates that the classifier has strong separability even when some classes are linguistically similar.

## Generated Artifacts
The following files were generated by the updated training pipeline:
- [ml-service/reports/classifier/classifier_evaluation_latest.json](../ml-service/reports/classifier/classifier_evaluation_latest.json)
- [ml-service/reports/classifier/figures/05_confusion_matrix.png](../ml-service/reports/classifier/figures/05_confusion_matrix.png)
- [ml-service/reports/classifier/figures/08_roc_curve.png](../ml-service/reports/classifier/figures/08_roc_curve.png)
- [ml-service/reports/classifier/figures/09_algorithm_comparison.png](../ml-service/reports/classifier/figures/09_algorithm_comparison.png)
- [ml-service/reports/classifier/figures/00_dataset_overview.txt](../ml-service/reports/classifier/figures/00_dataset_overview.txt)

## Short Conclusion
The AI subsystem in Taskora is a supervised text-classification service built around TF-IDF plus Logistic Regression. It is integrated through the FastAPI ML service, evaluated using a holdout split, and documented with confusion-matrix, ROC, and algorithm-comparison figures suitable for academic reporting and poster presentation.
