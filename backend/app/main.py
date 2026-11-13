from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="VoiceGuard API",
    version="0.1.0",
    description="Backend API for VoiceGuard AI voice-authenticity analysis.",
)

# Configure this list for the deployed frontend origin before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_AUDIO_BYTES = 20 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/webm",
    "application/octet-stream",
}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "voiceguard-api",
        "model_loaded": False,
    }


@app.post("/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()

    supported_extension = filename.endswith(
        (".mp3", ".wav", ".m4a", ".mp4", ".webm")
    )
    supported_type = content_type in ALLOWED_CONTENT_TYPES

    if not (supported_extension or supported_type):
        raise HTTPException(
            status_code=415,
            detail="Unsupported audio format. Upload MP3, WAV, M4A, or WebM audio.",
        )

    audio = await file.read(MAX_AUDIO_BYTES + 1)
    if not audio:
        raise HTTPException(status_code=400, detail="The uploaded audio file is empty.")
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds the 20 MB limit.")

    # Deliberately fail closed until a trained and validated model is installed.
    # Returning a fabricated probability here would give users false confidence.
    raise HTTPException(
        status_code=503,
        detail={
            "code": "MODEL_NOT_CONFIGURED",
            "message": (
                "The API is running, but no trained voice-authenticity model is "
                "configured yet. No authenticity verdict was produced."
            ),
        },
    )
