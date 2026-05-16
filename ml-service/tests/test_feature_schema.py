EXPECTED_RISK_FEATURES = {
    "due_in_days",
    "recent_activity_count",
    "task_frequency",
    "project_historical_risk_rate",
}


def test_expected_risk_feature_schema_constant():
    assert len(EXPECTED_RISK_FEATURES) == 4
