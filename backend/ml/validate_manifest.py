#!/usr/bin/env python3
"""Validate a VoiceGuard audio manifest without loading audio into memory."""

import argparse
import csv
import hashlib
import sys
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_COLUMNS = {
    "relative_path",
    "label",
    "speaker_id",
    "source_speaker_id",
    "system",
    "dataset",
    "split",
}
ALLOWED_LABELS = {"real", "synthetic"}
ALLOWED_SPLITS = {"train", "validation", "test"}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as audio_file:
        for chunk in iter(lambda: audio_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_manifest(manifest_path: Path) -> list[str]:
    errors: list[str] = []
    speaker_splits: dict[str, set[str]] = defaultdict(set)
    content_splits: dict[str, set[str]] = defaultdict(set)
    seen_paths: set[str] = set()
    row_count = 0

    try:
        manifest_file = manifest_path.open("r", encoding="utf-8-sig", newline="")
    except OSError as exc:
        return [f"Cannot open manifest: {exc}"]

    with manifest_file:
        reader = csv.DictReader(manifest_file)
        columns = set(reader.fieldnames or [])
        missing = REQUIRED_COLUMNS - columns
        if missing:
            return [f"Missing required columns: {', '.join(sorted(missing))}"]

        for line_number, row in enumerate(reader, start=2):
            row_count += 1
            relative_path = (row.get("relative_path") or "").strip()
            label = (row.get("label") or "").strip().lower()
            split = (row.get("split") or "").strip().lower()
            speaker_id = (row.get("speaker_id") or "").strip()
            source_speaker_id = (row.get("source_speaker_id") or "").strip()
            dataset = (row.get("dataset") or "").strip()

            if not relative_path:
                errors.append(f"Line {line_number}: relative_path is empty.")
                continue
            if relative_path in seen_paths:
                errors.append(f"Line {line_number}: duplicate path {relative_path}.")
            seen_paths.add(relative_path)

            if label not in ALLOWED_LABELS:
                errors.append(f"Line {line_number}: invalid label {label!r}.")
            if split not in ALLOWED_SPLITS:
                errors.append(f"Line {line_number}: invalid split {split!r}.")
            if not speaker_id or not source_speaker_id or not dataset:
                errors.append(
                    f"Line {line_number}: speaker_id, source_speaker_id, "
                    "and dataset are required."
                )

            # Resolve paths safely beneath the repository root.
            candidate = (REPO_ROOT / relative_path).resolve()
            if not candidate.is_relative_to(REPO_ROOT):
                errors.append(f"Line {line_number}: path escapes repository root.")
                continue
            if not candidate.is_file():
                errors.append(f"Line {line_number}: audio file not found: {relative_path}.")
                continue

            speaker_key = f"{dataset}:{source_speaker_id or speaker_id}"
            if split in ALLOWED_SPLITS and source_speaker_id:
                speaker_splits[speaker_key].add(split)

            expected_hash = (row.get("sha256") or "").strip().lower()
            if expected_hash:
                actual_hash = sha256_file(candidate)
                if actual_hash != expected_hash:
                    errors.append(f"Line {line_number}: SHA-256 mismatch for {relative_path}.")
                else:
                    content_splits[actual_hash].add(split)

    if row_count == 0:
        errors.append("Manifest contains no data rows.")

    for speaker, splits in sorted(speaker_splits.items()):
        if len(splits) > 1:
            errors.append(
                f"Speaker leakage: {speaker} appears in {', '.join(sorted(splits))}."
            )

    for digest, splits in sorted(content_splits.items()):
        if len(splits) > 1:
            errors.append(
                f"Duplicate audio content appears across splits (SHA-256 {digest})."
            )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, help="Path to the dataset CSV manifest.")
    args = parser.parse_args()

    errors = validate_manifest(args.manifest)
    if errors:
        print("Manifest validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Manifest structure and split checks passed.")
    print("This does not verify label correctness, dataset quality, or representativeness.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
