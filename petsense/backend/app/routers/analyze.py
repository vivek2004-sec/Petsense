from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.pet import Pet
from app.models.scan import Scan
from app.schemas.scan import ScanResponse
from app.services.auth_service import get_current_user
from app.services.inference_service import inference_service
from app.services.storage_service import (
    save_upload,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_AUDIO_TYPES,
)

router = APIRouter()


@router.post("/image", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def analyze_image(
    file: UploadFile = File(..., description="Pet photo or short video clip"),
    pet_id: Optional[int] = Form(None),
    species: str = Form("dog", description="'dog' or 'cat'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze a pet image/video for emotional state and pain indicators.
    Returns emotion label, confidence score, pain-risk level, and detected cues.
    """
    _validate_pet_ownership(pet_id, current_user.id, db)

    image_path = await save_upload(file, subfolder="scans/images", allowed_types=ALLOWED_IMAGE_TYPES)
    content = open(f"./uploads/{image_path}", "rb").read()

    vision = inference_service.analyze_image(content, species=species)
    report = inference_service.fuse(vision=vision, audio=None)

    scan = Scan(
        pet_id=pet_id,
        user_id=current_user.id,
        scan_type="image",
        emotion_label=report.emotion_label,
        confidence=report.confidence,
        pain_risk=report.pain_risk,
        cues_detected=report.cues_detected,
        explanation=report.explanation,
        disclaimer=report.disclaimer,
        image_path=image_path,
        raw_result=report.raw_result,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


@router.post("/audio", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def analyze_audio(
    file: UploadFile = File(..., description="Pet audio recording (bark/meow/whine)"),
    pet_id: Optional[int] = Form(None),
    species: str = Form("dog", description="'dog' or 'cat'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Classify a pet audio recording into emotion/distress categories.
    """
    _validate_pet_ownership(pet_id, current_user.id, db)

    audio_path = await save_upload(file, subfolder="scans/audio", allowed_types=ALLOWED_AUDIO_TYPES)
    content = open(f"./uploads/{audio_path}", "rb").read()

    audio = inference_service.analyze_audio(content, species=species)
    report = inference_service.fuse(vision=None, audio=audio)

    scan = Scan(
        pet_id=pet_id,
        user_id=current_user.id,
        scan_type="audio",
        audio_label=report.audio_label,
        emotion_label=report.emotion_label,
        confidence=report.confidence,
        pain_risk=report.pain_risk,
        cues_detected=report.cues_detected,
        explanation=report.explanation,
        disclaimer=report.disclaimer,
        audio_path=audio_path,
        raw_result=report.raw_result,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


@router.post("/combined", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def analyze_combined(
    image_file: UploadFile = File(..., description="Pet image or video"),
    audio_file: UploadFile = File(..., description="Pet audio recording"),
    pet_id: Optional[int] = Form(None),
    species: str = Form("dog", description="'dog' or 'cat'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze both image and audio and return a fused report combining both signals.
    This is the most accurate analysis mode.
    """
    _validate_pet_ownership(pet_id, current_user.id, db)

    image_path = await save_upload(image_file, subfolder="scans/images", allowed_types=ALLOWED_IMAGE_TYPES)
    audio_path = await save_upload(audio_file, subfolder="scans/audio", allowed_types=ALLOWED_AUDIO_TYPES)

    img_bytes = open(f"./uploads/{image_path}", "rb").read()
    aud_bytes = open(f"./uploads/{audio_path}", "rb").read()

    vision = inference_service.analyze_image(img_bytes, species=species)
    audio  = inference_service.analyze_audio(aud_bytes, species=species)
    report = inference_service.fuse(vision=vision, audio=audio)

    scan = Scan(
        pet_id=pet_id,
        user_id=current_user.id,
        scan_type="combined",
        emotion_label=report.emotion_label,
        confidence=report.confidence,
        pain_risk=report.pain_risk,
        audio_label=report.audio_label,
        cues_detected=report.cues_detected,
        explanation=report.explanation,
        disclaimer=report.disclaimer,
        image_path=image_path,
        audio_path=audio_path,
        raw_result=report.raw_result,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


# ── Helpers ──────────────────────────────────────────────────────────────────

def _validate_pet_ownership(pet_id: Optional[int], user_id: int, db: Session):
    """Ensure the pet_id belongs to the current user (if provided)."""
    if pet_id is not None:
        pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == user_id).first()
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found or does not belong to you.",
            )
