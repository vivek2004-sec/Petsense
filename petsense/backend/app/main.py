import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db
from app.routers import auth, pets, analyze, scans

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    os.makedirs(settings.upload_dir, exist_ok=True)
    yield
    # Shutdown (nothing to clean up)


app = FastAPI(
    title="PetSense API",
    description=(
        "AI-powered pet emotion & pain analysis API. "
        "⚠️ Not a veterinary diagnostic tool — always consult a vet."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ────────────────────────────────────────────────────────────────────
cors_list = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
if "*" in cors_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    for default_origin in ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]:
        if default_origin not in cors_list:
            cors_list.append(default_origin)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ── Static uploads ───────────────────────────────────────────────────────────
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth, prefix="/auth", tags=["Authentication"])
app.include_router(pets, prefix="/pets", tags=["Pet Profiles"])
app.include_router(analyze, prefix="/analyze", tags=["Analysis"])
app.include_router(scans, prefix="/scans", tags=["Scan History"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "PetSense API",
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs",
        "disclaimer": (
            "PetSense is a wellness awareness tool, not a veterinary diagnostic device. "
            "Always consult a licensed veterinarian for health concerns."
        ),
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
