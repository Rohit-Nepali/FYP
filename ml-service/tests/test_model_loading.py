from pathlib import Path


def test_models_folder_exists():
    base_dir = Path(__file__).resolve().parents[1]
    models_dir = base_dir / "models"
    assert models_dir.exists(), "models directory should exist"
