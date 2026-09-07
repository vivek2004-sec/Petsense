from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class PetCreate(BaseModel):
    name: str
    species: str   # "dog" | "cat"
    breed: Optional[str] = None
    birth_date: Optional[date] = None
    notes: Optional[str] = None


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    birth_date: Optional[date] = None
    notes: Optional[str] = None


class PetResponse(BaseModel):
    id: int
    user_id: int
    name: str
    species: str
    breed: Optional[str]
    birth_date: Optional[date]
    photo_url: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
