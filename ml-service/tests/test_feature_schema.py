EXPECTED_RISK_FEATURES = {
    "is_completed",
    "due_in_days",
    "days_overdue",
    "recent_activity_count",
    "behavior_risk_score",
}


def test_expected_risk_feature_schema_constant():
    assert len(EXPECTED_RISK_FEATURES) == 5
