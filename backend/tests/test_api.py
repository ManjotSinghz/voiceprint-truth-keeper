from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_reports_model_not_loaded():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "voiceguard-api",
        "model_loaded": False,
    }


def test_analyze_rejects_unsupported_file():
    response = client.post(
        "/analyze",
        files={"file": ("notes.txt", b"not audio", "text/plain")},
    )

    assert response.status_code == 415
    assert "Unsupported audio format" in response.json()["detail"]


def test_analyze_rejects_empty_audio():
    response = client.post(
        "/analyze",
        files={"file": ("sample.wav", b"", "audio/wav")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "The uploaded audio file is empty."


def test_analyze_rejects_audio_over_20_mb():
    oversized_audio = b"0" * (20 * 1024 * 1024 + 1)
    response = client.post(
        "/analyze",
        files={"file": ("sample.wav", oversized_audio, "audio/wav")},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Audio file exceeds the 20 MB limit."


def test_analyze_does_not_return_a_verdict_without_a_model():
    response = client.post(
        "/analyze",
        files={"file": ("sample.wav", b"valid-enough-for-upload-check", "audio/wav")},
    )

    assert response.status_code == 503
    detail = response.json()["detail"]
    assert detail["code"] == "MODEL_NOT_CONFIGURED"
    assert "No authenticity verdict was produced." in detail["message"]
