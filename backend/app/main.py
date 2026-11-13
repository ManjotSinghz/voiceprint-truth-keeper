from io import BytesIO

import librosa
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="VoiceGuard API",
    version="0.2.0",
    description="Demo heuristic API for VoiceGuard AI voice analysis.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_AUDIO_BYTES = 20 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {
    "audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4",
    "audio/m4a", "audio/webm", "audio/ogg",
}
ALLOWED_EXTENSIONS = (".mp3", ".wav", ".m4a", ".mp4", ".webm", ".ogg")


def _unit_interval(value: float) -> float:
    return float(np.clip(value, 0.0, 1.0))


def analyze_heuristically(audio_bytes: bytes) -> dict:
    """Return a demo-only heuristic score; this is not a trained detector."""
    try:
        samples, sample_rate = librosa.load(
            BytesIO(audio_bytes), sr=22050, mono=True, duration=45.0
        )
    except Exception as exc:
        raise ValueError(
            "Could not decode this audio. Try a standard WAV or MP3 file."
        ) from exc

    if samples.size == 0:
        raise ValueError("No audio samples were found.")
    duration = samples.size / sample_rate
    if duration < 0.5:
        raise ValueError("Audio is too short. Please provide at least 0.5 seconds.")

    rms = librosa.feature.rms(y=samples)[0]
    centroid = librosa.feature.spectral_centroid(y=samples, sr=sample_rate)[0]
    flatness = librosa.feature.spectral_flatness(y=samples)[0]
    zcr = librosa.feature.zero_crossing_rate(y=samples)[0]

    rms_cv = float(np.std(rms) / (np.mean(rms) + 1e-8))
    centroid_cv = float(np.std(centroid) / (np.mean(centroid) + 1e-8))
    flatness_mean = float(np.mean(flatness))
    zcr_std = float(np.std(zcr))

    # These arbitrary thresholds only create a repeatable demo score.
    # They are not learned from data and are not evidence of authenticity.
    consistency_signal = 1.0 - _unit_interval(rms_cv / 1.2)
    spectral_signal = 1.0 - _unit_interval(centroid_cv / 0.8)
    texture_signal = 1.0 - _unit_interval(flatness_mean / 0.35)
    rhythm_signal = 1.0 - _unit_interval(zcr_std / 0.12)

    score = (
        0.30 * consistency_signal
        + 0.30 * spectral_signal
        + 0.20 * texture_signal
        + 0.20 * rhythm_signal
    )
    score = float(np.clip(score, 0.02, 0.98))

    signals = [
        {
            "label": "Amplitude variation",
            "detail": f"Frame-level loudness variation index: {rms_cv:.3f}.",
            "weight": consistency_signal,
        },
        {
            "label": "Spectral consistency",
            "detail": f"Spectral-centroid variation index: {centroid_cv:.3f}.",
            "weight": spectral_signal,
        },
        {
            "label": "Audio texture",
            "detail": f"Mean spectral-flatness index: {flatness_mean:.3f}.",
            "weight": texture_signal,
        },
        {
            "label": "Short-term rhythm",
            "detail": f"Zero-crossing variation index: {zcr_std:.3f}.",
            "weight": rhythm_signal,
        },
    ]

    return {
        "aiProbability": round(score, 4),
        "signals": signals,
        "analysisMode": "heuristic_demo",
        "disclaimer": (
            "Experimental rule-based estimate only. This is not a trained or "
            "validated AI voice detector and can be wrong."
        ),
        "durationSeconds": round(duration, 2),
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "voiceguard-api",
        "model_loaded": False,
        "analysis_mode": "heuristic_demo",
    }


@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()
    if not filename.endswith(ALLOWED_EXTENSIONS) and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Unsupported audio format. Upload MP3, WAV, M4A, WebM, or OGG audio.",
        )

    audio = await file.read(MAX_AUDIO_BYTES + 1)
    if not audio:
        raise HTTPException(status_code=400, detail="The uploaded audio file is empty.")
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds the 20 MB limit.")

    try:
        return analyze_heuristically(audio)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
