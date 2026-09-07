from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.pet import Pet
from app.schemas.pet import PetCreate, PetUpdate, PetResponse
from app.services.auth_service import get_current_user
from app.services.storage_service import save_upload, delete_upload, ALLOWED_IMAGE_TYPES

router = APIRouter()


@router.post("", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
def create_pet(
    payload: PetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new pet profile."""
    if payload.species not in ("dog", "cat"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Species must be 'dog' or 'cat'.",
        )
    pet = Pet(**payload.model_dump(), user_id=current_user.id)
    db.add(pet)
    db.commit()
    db.refresh(pet)
    return pet


@router.get("", response_model=List[PetResponse])
def list_pets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all pets belonging to the authenticated user."""
    return db.query(Pet).filter(Pet.user_id == current_user.id).all()


@router.get("/{pet_id}", response_model=PetResponse)
def get_pet(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific pet profile."""
    pet = _get_pet_or_404(pet_id, current_user.id, db)
    return pet


@router.patch("/{pet_id}", response_model=PetResponse)
def update_pet(
    pet_id: int,
    payload: PetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a pet profile."""
    pet = _get_pet_or_404(pet_id, current_user.id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pet, field, value)
    db.commit()
    db.refresh(pet)
    return pet


@router.post("/{pet_id}/photo", response_model=PetResponse)
async def upload_pet_photo(
    pet_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload or replace a pet's profile photo."""
    pet = _get_pet_or_404(pet_id, current_user.id, db)

    # Delete old photo if present
    if pet.photo_url:
        delete_upload(pet.photo_url)

    path = await save_upload(file, subfolder="pet_photos", allowed_types=ALLOWED_IMAGE_TYPES)
    pet.photo_url = path
    db.commit()
    db.refresh(pet)
    return pet


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pet(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a pet profile and all associated scans."""
    pet = _get_pet_or_404(pet_id, current_user.id, db)
    db.delete(pet)
    db.commit()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_pet_or_404(pet_id: int, user_id: int, db: Session) -> Pet:
    pet = db.query(Pet).filter(Pet.id == pet_id, Pet.user_id == user_id).first()
    if not pet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found.")
    return pet
