# VoiceGuard API

FastAPI service foundation for the VoiceGuard frontend.

## Current status

- `GET /health`: implemented.
- `POST /analyze`: validates an audio upload (MP3, WAV, M4A, or WebM; maximum 20 MB).
- Model inference: **not implemented**. The endpoint returns HTTP 503 with
  `MODEL_NOT_CONFIGURED` until a trained, evaluated model is integrated.

This is intentional. The service must not invent an AI probability or imply that
simple acoustic rules are a validated deepfake detector.

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

Open the interactive API docs at http://127.0.0.1:8000/docs.

## Before deployment

1. Restrict CORS to the actual deployed frontend origin.
2. Add request rate limiting and authentication if the API is exposed publicly.
3. Add malware/content scanning and temporary-file cleanup if uploads are persisted.
4. Integrate a trained model and evaluate it on held-out real and synthetic speech.
5. Return calibrated probabilities only if calibration has been measured; otherwise
   return a model score with clear limitations.
