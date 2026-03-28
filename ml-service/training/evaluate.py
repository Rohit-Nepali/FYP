from __future__ import annotations

import argparse
import json
from pathlib import Path

from common import METADATA_PATH


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Print latest Taskora model metadata.")
    parser.add_argument(
        "--metadata",
        type=Path,
        default=METADATA_PATH,
        help="Path to model metadata JSON file.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if not args.metadata.exists():
        raise FileNotFoundError(f"Metadata file not found: {args.metadata}")

    with args.metadata.open("r", encoding="utf-8") as file_obj:
        metadata = json.load(file_obj)

    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
