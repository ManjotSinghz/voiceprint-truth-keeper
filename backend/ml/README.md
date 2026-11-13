# VoiceGuard model development

This directory contains the data contract and validation utilities for model
experiments. It does not contain audio datasets or a trained model.

## Dataset layout

Keep downloaded datasets outside Git (for example, under `backend/data/`).
Do not commit private, licensed, or consent-restricted audio.

Create a CSV manifest using the columns in `dataset_manifest.example.csv`.
Paths in `relative_path` are relative to the repository root.

Labels:
- `real`: human speech recorded from a real speaker.
- `synthetic`: speech generated or converted by an AI system.

Record the dataset and generation system for every sample. Do not infer labels
from filenames alone; verify them against the dataset's official metadata.

## Split policy

Use speaker-independent splits. A speaker (or source speaker for converted
speech) must appear in exactly one of train, validation, or test. Keep all
recordings and generated variants derived from the same source speaker in the
same split. Prefer a separate external dataset for a final generalisation test.

Do not randomly split individual audio clips: that can leak speaker identity,
recording conditions, or generation-system fingerprints across splits.

## Validate a manifest

From the repository root:

```bash
python backend/ml/validate_manifest.py backend/ml/dataset_manifest.csv
```

The validator checks required fields, labels, file existence, path traversal,
speaker split leakage, and optional SHA-256 checksums. It does not certify that
the labels are correct or that a dataset is representative.

## Before training

1. Confirm each dataset's licence, permitted research/commercial use, and consent terms.
2. Record dataset version, download source, and any preprocessing.
3. Inspect class balance across splits and across synthesis systems.
4. Keep a final test set untouched until model selection is complete.
5. Evaluate cross-dataset and cross-speaker performance; report class-wise
   precision/recall, ROC-AUC, confusion matrix, and calibration where applicable.
6. Test robustness to codecs, resampling, noise, compression, and varied recording devices.

A model score is not proof that a voice is real or synthetic. Avoid presenting
scores as calibrated probabilities unless calibration has been measured on
representative held-out data.
