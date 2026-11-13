# VoiceGuard API

FastAPI backend for the VoiceGuard AI demonstration app.

## Analysis mode

The current implementation uses a deterministic, rule-based audio heuristic
with librosa features (RMS variation, spectral-centroid variation, spectral
flatness, and zero-crossing variation). It returns an `aiProbability`-shaped
score so the existing frontend can display a result.

**Important:** this is not a trained or validated AI voice detector. The score
is an arbitrary demo heuristic, not a calibrated probability. It can classify
real speech as synthetic and synthetic speech as real. Do not use it for
security, identity verification, financial decisions, or other consequential
decisions.

## Run locally

From the repository root:

```bash
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: http://127.0.0.1:8000/docs

## Tests

From the repository root:

```bash
pytest backend/tests -q
```

The tests generate a small WAV signal in memory. They do not require a dataset
or a trained model.

## API response

`POST /analyze` accepts multipart form data with the field name `file`.
A successful response includes `aiProbability` (0..1), `signals`,
`analysisMode: heuristic_demo`, a disclaimer, and clip duration.

For production, replace the heuristic with a properly evaluated detector,
restrict CORS to the deployed frontend, and add rate limiting and upload controls.
