import io
import wave

import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def make_wav(seconds: float = 1.5, sample_rate: int = 22050) -> bytes:
    t = np.linspace(0, seconds, int(sample_rate * seconds), endpoint=False)
    # A speech-like test signal with gentle amplitude modulation.
    signal = 0.25 * np.sin(2 * np.pi * 180 * t) * (0.7 + 0.3 * np.sin(2 * np.pi * 3 * t))
    pcm = (signal * 32767).astype(np.int16)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm.tobytes())
    return buffer.getvalue()


def test_health_reports_demo_mode():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["analysis_mode"] == "heuristic_demo"
    assert response.json()["model_loaded"] is False


def test_analyze_rejects_unsupported_file():
    response = client.post("/analyze", files={"file": ("notes.txt", b"not audio", "text/plain")})
    assert response.status_code == 415


def test_analyze_rejects_empty_audio():
    response = client.post("/analyze", files={"file": ("sample.wav", b"", "audio/wav")})
    assert response.status_code == 400


def test_analyze_rejects_audio_over_20_mb():
    oversized = b"0" * (20 * 1024 * 1024 + 1)
    response = client.post("/analyze", files={"file": ("sample.wav", oversized, "audio/wav")})
    assert response.status_code == 413


def test_analyze_returns_demo_score_and_disclaimer():
    response = client.post(
        "/analyze",
        files={"file": ("sample.wav", make_wav(), "audio/wav")},
    )
    assert response.status_code == 200
    body = response.json()
    assert 0.0 <= body["aiProbability"] <= 1.0
    assert body["analysisMode"] == "heuristic_demo"
    assert "not a trained" in body["disclaimer"]
    assert len(body["signals"]) == 4


def test_analyze_rejects_too_short_audio():
    response = client.post(
        "/analyze",
        files={"file": ("sample.wav", make_wav(seconds=0.1), "audio/wav")},
    )
    assert response.status_code == 422
