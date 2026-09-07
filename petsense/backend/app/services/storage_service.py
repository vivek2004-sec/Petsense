"""
Storage Service — handles file uploads with validation.
"""
import os
import uuid
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException, status
from app.config import get_settings

settings = get_settings()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/x-wav"}
MAX_BYTES = settings.max_upload_size_mb * 1024 * 1024


async def save_upload(
    file: UploadFile,
    subfolder: str = "misc",
    allowed_types: Optional[set] = None,
) -> str:
    """
    Validates and saves an uploaded file.
    Returns the relative path (from UPLOAD_DIR) so it can be stored in DB
    and served via /uploads/<path>.
    """
    if allowed_types and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {allowed_types}",
        )

    # Read and size-check
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.max_upload_size_mb} MB.",
        )

    # Build destination path
    ext = Path(file.filename or "upload").suffix or ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_dir = Path(settings.upload_dir) / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / filename

    with open(dest_path, "wb") as f:
        f.write(content)

    return str(Path(subfolder) / filename)


def delete_upload(relative_path: str) -> None:
    """Delete a previously saved upload."""
    full_path = Path(settings.upload_dir) / relative_path
    if full_path.exists():
        full_path.unlink()
